const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GameSession = sequelize.define('GameSession', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    userId: {
      type: DataTypes.INTEGER,
      field: 'user_id',
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    sessionType: {
      type: DataTypes.STRING(20),
      field: 'session_type',
      allowNull: false,
      defaultValue: 'solo',
      validate: {
        isIn: {
          args: [['solo', 'multiplayer']],
          msg: 'Session type must be solo or multiplayer'
        }
      }
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
      validate: {
        isIn: {
          args: [['active', 'completed', 'abandoned', 'expired']],
          msg: 'Invalid session status'
        }
      }
    },
    categoryId: {
      type: DataTypes.INTEGER,
      field: 'category_id',
      references: {
        model: 'categories',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    difficultyLevel: {
      type: DataTypes.INTEGER,
      field: 'difficulty_level',
      validate: {
        min: {
          args: [1],
          msg: 'Difficulty level must be between 1 and 5'
        },
        max: {
          args: [5],
          msg: 'Difficulty level must be between 1 and 5'
        }
      }
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      field: 'total_questions',
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: 'Total questions must be at least 1'
        },
        max: {
          args: [50],
          msg: 'Total questions cannot exceed 50'
        }
      }
    },
    currentQuestionIndex: {
      type: DataTypes.INTEGER,
      field: 'current_question_index',
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Current question index cannot be negative'
        }
      }
    },
    score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Score cannot be negative'
        }
      }
    },
    xpEarned: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'xp_earned',
      validate: {
        min: {
          args: [0],
          msg: 'XP earned cannot be negative'
        }
      }
    },
    correctAnswers: {
      type: DataTypes.INTEGER,
      field: 'correct_answers',
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Correct answers cannot be negative'
        }
      }
    },
    incorrectAnswers: {
      type: DataTypes.INTEGER,
      field: 'incorrect_answers',
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Incorrect answers cannot be negative'
        }
      }
    },
    startedAt: {
      type: DataTypes.DATE,
      field: 'started_at',
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    completedAt: {
      type: DataTypes.DATE,
      field: 'completed_at'
    },
    totalTimeSpent: {
      type: DataTypes.INTEGER,
      field: 'total_time_spent',
      validate: {
        min: {
          args: [0],
          msg: 'Total time spent cannot be negative'
        }
      }
    },
    questionIds: {
      type: DataTypes.JSONB,
      field: 'question_ids',
      allowNull: false,
      defaultValue: [],
      validate: {
        isArray(value) {
          if (!Array.isArray(value)) {
            throw new Error('Question IDs must be an array');
          }
        }
      }
    },
    answers: {
      type: DataTypes.JSONB,
      defaultValue: [],
      validate: {
        isArray(value) {
          if (!Array.isArray(value)) {
            throw new Error('Answers must be an array');
          }
        }
      }
    },
    timePerQuestion: {
      type: DataTypes.JSONB,
      field: 'time_per_question',
      defaultValue: [],
      validate: {
        isArray(value) {
          if (!Array.isArray(value)) {
            throw new Error('Time per question must be an array');
          }
        }
      }
    },
    sessionData: {
      type: DataTypes.JSONB,
      field: 'session_data',
      defaultValue: {}
    }
  }, {
    tableName: 'game_sessions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['session_type']
      },
      {
        fields: ['started_at']
      },
      {
        fields: ['user_id', 'status']
      }
    ]
  });

  // Instance methods
  GameSession.prototype.getProgress = function() {
    return {
      current: this.currentQuestionIndex + 1,
      total: this.totalQuestions,
      percentage: Math.round(((this.currentQuestionIndex + 1) / this.totalQuestions) * 100)
    };
  };

  GameSession.prototype.getAccuracy = function() {
    const totalAnswered = this.correctAnswers + this.incorrectAnswers;
    return totalAnswered > 0 ? Math.round((this.correctAnswers / totalAnswered) * 100) : 0;
  };

  GameSession.prototype.getAverageTimePerQuestion = function() {
    if (!this.timePerQuestion || this.timePerQuestion.length === 0) return 0;
    const totalTime = this.timePerQuestion.reduce((sum, time) => sum + time, 0);
    return Math.round(totalTime / this.timePerQuestion.length);
  };

  GameSession.prototype.isComplete = function() {
    return this.status === 'completed' || this.currentQuestionIndex >= this.totalQuestions;
  };

  GameSession.prototype.canContinue = function() {
    return this.status === 'active' && this.currentQuestionIndex < this.totalQuestions;
  };

  GameSession.prototype.complete = async function() {
    this.status = 'completed';
    this.completedAt = new Date();
    this.totalTimeSpent = this.timePerQuestion.reduce((sum, time) => sum + time, 0);
    await this.save();
  };

  GameSession.prototype.abandon = async function() {
    this.status = 'abandoned';
    this.completedAt = new Date();
    this.totalTimeSpent = this.timePerQuestion.reduce((sum, time) => sum + time, 0);
    await this.save();
  };

  GameSession.prototype.addAnswer = function(questionId, userAnswer, correctAnswer, isCorrect, points, timeSpent) {
    const answerData = {
      questionId,
      userAnswer,
      correctAnswer,
      isCorrect,
      points,
      timeSpent,
      answeredAt: new Date()
    };

    this.answers = [...this.answers, answerData];
    this.timePerQuestion = [...this.timePerQuestion, timeSpent];
    
    if (isCorrect) {
      this.correctAnswers += 1;
      this.score += points;
    } else {
      this.incorrectAnswers += 1;
    }

    this.currentQuestionIndex += 1;
  };

  GameSession.prototype.getDetailedStats = function() {
    const totalAnswered = this.correctAnswers + this.incorrectAnswers;
    const averageTime = this.getAverageTimePerQuestion();
    
    return {
      sessionId: this.id,
      finalScore: this.score,
      totalQuestions: this.totalQuestions,
      questionsAnswered: totalAnswered,
      correctAnswers: this.correctAnswers,
      incorrectAnswers: this.incorrectAnswers,
      accuracy: this.getAccuracy(),
      totalTimeSpent: this.totalTimeSpent || 0,
      averageTimePerQuestion: averageTime,
      completedAt: this.completedAt,
      status: this.status,
      progress: this.getProgress()
    };
  };

  // Class methods
  GameSession.getActiveSession = async function(userId) {
    return await GameSession.findOne({
      where: {
        userId,
        status: 'active'
      },
      order: [['started_at', 'DESC']]
    });
  };

  GameSession.getUserSessions = async function(userId, limit = 10) {
    return await GameSession.findAll({
      where: { userId },
      order: [['started_at', 'DESC']],
      limit,
      attributes: {
        exclude: ['sessionData', 'answers'] // Exclude heavy data
      }
    });
  };

  GameSession.getSessionStats = async function(userId, timeframe = '30days') {
    const startDate = new Date();
    if (timeframe === '7days') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === '30days') {
      startDate.setDate(startDate.getDate() - 30);
    }

    const sessions = await GameSession.findAll({
      where: {
        userId,
        startedAt: {
          [sequelize.Sequelize.Op.gte]: startDate
        }
      }
    });

    const stats = {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      averageScore: 0,
      averageAccuracy: 0,
      totalTimeSpent: 0
    };

    if (sessions.length > 0) {
      const completedSessions = sessions.filter(s => s.status === 'completed');
      if (completedSessions.length > 0) {
        stats.averageScore = Math.round(
          completedSessions.reduce((sum, s) => sum + s.score, 0) / completedSessions.length
        );
        stats.averageAccuracy = Math.round(
          completedSessions.reduce((sum, s) => sum + s.getAccuracy(), 0) / completedSessions.length
        );
      }
      stats.totalTimeSpent = sessions.reduce((sum, s) => sum + (s.totalTimeSpent || 0), 0);
    }

    return stats;
  };

  // Associations will be defined in index.js
  GameSession.associate = function(models) {
    GameSession.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    GameSession.belongsTo(models.Category, {
      foreignKey: 'categoryId',
      as: 'category'
    });
  };

  return GameSession;
};