const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Question = sequelize.define('Question', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
    questionText: {
      type: DataTypes.TEXT,
      field: 'question_text',
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Question text cannot be empty'
        },
        len: {
          args: [10, 1000],
          msg: 'Question text must be between 10 and 1000 characters'
        }
      }
    },
    questionType: {
      type: DataTypes.STRING(20),
      field: 'question_type',
      defaultValue: 'multiple_choice',
      validate: {
        isIn: {
          args: [['multiple_choice', 'true_false', 'fill_blank', 'essay']],
          msg: 'Invalid question type'
        }
      }
    },
    options: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidOptions(value) {
          if (!Array.isArray(value) || value.length < 2) {
            throw new Error('Options must be an array with at least 2 choices');
          }
          if (value.length > 6) {
            throw new Error('Options cannot exceed 6 choices');
          }
          value.forEach(option => {
            if (typeof option !== 'string' || option.trim().length === 0) {
              throw new Error('Each option must be a non-empty string');
            }
          });
        }
      }
    },
    correctAnswer: {
      type: DataTypes.TEXT,
      field: 'correct_answer',
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Correct answer cannot be empty'
        }
      }
    },
    explanation: {
      type: DataTypes.TEXT,
      validate: {
        len: {
          args: [0, 2000],
          msg: 'Explanation cannot exceed 2000 characters'
        }
      }
    },
    difficultyLevel: {
      type: DataTypes.INTEGER,
      field: 'difficulty_level',
      defaultValue: 1,
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
    imageUrl: {
      type: DataTypes.TEXT,
      field: 'image_url',
      validate: {
        isUrl: {
          msg: 'Must be a valid URL'
        }
      }
    },
    audioUrl: {
      type: DataTypes.TEXT,
      field: 'audio_url',
      validate: {
        isUrl: {
          msg: 'Must be a valid URL'
        }
      }
    },
    timeLimit: {
      type: DataTypes.INTEGER,
      field: 'time_limit',
      defaultValue: 30,
      validate: {
        min: {
          args: [5],
          msg: 'Time limit must be at least 5 seconds'
        },
        max: {
          args: [300],
          msg: 'Time limit cannot exceed 300 seconds (5 minutes)'
        }
      }
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
      validate: {
        min: {
          args: [1],
          msg: 'Points must be at least 1'
        },
        max: {
          args: [100],
          msg: 'Points cannot exceed 100'
        }
      }
    },
    hint: {
      type: DataTypes.TEXT,
      validate: {
        len: {
          args: [0, 500],
          msg: 'Hint cannot exceed 500 characters'
        }
      }
    },
    createdBy: {
      type: DataTypes.INTEGER,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      field: 'is_active',
      defaultValue: true
    },
    usageCount: {
      type: DataTypes.INTEGER,
      field: 'usage_count',
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Usage count cannot be negative'
        }
      }
    },
    successRate: {
      type: DataTypes.DECIMAL(5, 2),
      field: 'success_rate',
      defaultValue: 0.00,
      validate: {
        min: {
          args: [0],
          msg: 'Success rate cannot be negative'
        },
        max: {
          args: [100],
          msg: 'Success rate cannot exceed 100%'
        }
      }
    }
  }, {
    tableName: 'questions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['category_id']
      },
      {
        fields: ['difficulty_level']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['usage_count']
      },
      {
        fields: ['success_rate']
      }
    ]
  });

  // Instance methods
  Question.prototype.toSafeJSON = function() {
    const values = { ...this.dataValues };
    // Remove sensitive data for public API responses
    delete values.correctAnswer;
    return values;
  };

  Question.prototype.toQuizJSON = function() {
    const values = { ...this.dataValues };
    // Include correct answer for quiz validation but exclude from general responses
    return values;
  };

  Question.prototype.incrementUsage = async function(isCorrect = false) {
    this.usageCount += 1;
    
    // Calculate new success rate
    const totalCorrect = Math.round((this.successRate / 100) * (this.usageCount - 1));
    const newTotalCorrect = isCorrect ? totalCorrect + 1 : totalCorrect;
    this.successRate = (newTotalCorrect / this.usageCount) * 100;
    
    await this.save();
  };

  // Class methods
  Question.getDifficultyLabel = function(level) {
    const labels = {
      1: 'Beginner',
      2: 'Easy', 
      3: 'Intermediate',
      4: 'Advanced',
      5: 'Expert'
    };
    return labels[level] || 'Unknown';
  };

  Question.getPointsForDifficulty = function(level) {
    const pointsMap = {
      1: 5,   // Beginner
      2: 10,  // Easy
      3: 15,  // Intermediate
      4: 20,  // Advanced
      5: 25   // Expert
    };
    return pointsMap[level] || 10;
  };

  // Associations will be defined in index.js
  Question.associate = function(models) {
    Question.belongsTo(models.Category, {
      foreignKey: 'categoryId',
      as: 'category'
    });
    
    Question.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
  };

  return Question;
};