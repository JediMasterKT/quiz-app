const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'Category name cannot be empty'
        },
        len: {
          args: [2, 100],
          msg: 'Category name must be between 2 and 100 characters'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      validate: {
        len: {
          args: [0, 500],
          msg: 'Description cannot exceed 500 characters'
        }
      }
    },
    iconUrl: {
      type: DataTypes.TEXT,
      field: 'icon_url',
      validate: {
        isUrl: {
          msg: 'Must be a valid URL'
        }
      }
    },
    colorCode: {
      type: DataTypes.STRING(7),
      field: 'color_code',
      defaultValue: '#007AFF',
      validate: {
        is: {
          args: /^#[0-9A-F]{6}$/i,
          msg: 'Color code must be a valid hex color (e.g., #FF0000)'
        }
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      field: 'is_active',
      defaultValue: true
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      field: 'display_order',
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Display order cannot be negative'
        }
      }
    }
  }, {
    tableName: 'categories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['name']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['display_order']
      }
    ]
  });

  // Instance methods
  Category.prototype.getQuestionCount = async function() {
    const Question = sequelize.models.Question;
    if (!Question) return 0;
    
    return await Question.count({
      where: {
        categoryId: this.id,
        isActive: true
      }
    });
  };

  Category.prototype.getQuestionCountByDifficulty = async function() {
    const Question = sequelize.models.Question;
    if (!Question) return {};
    
    const counts = await Question.findAll({
      where: {
        categoryId: this.id,
        isActive: true
      },
      attributes: [
        'difficultyLevel',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['difficultyLevel'],
      raw: true
    });

    const result = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    counts.forEach(count => {
      result[count.difficultyLevel] = parseInt(count.count);
    });

    return result;
  };

  Category.prototype.toJSONWithStats = async function() {
    const categoryData = this.toJSON();
    categoryData.questionCount = await this.getQuestionCount();
    categoryData.questionsByDifficulty = await this.getQuestionCountByDifficulty();
    return categoryData;
  };

  // Class methods
  Category.getActiveCategories = async function() {
    return await Category.findAll({
      where: { isActive: true },
      order: [['display_order', 'ASC'], ['name', 'ASC']]
    });
  };

  Category.getCategoriesWithQuestionCounts = async function() {
    const categories = await Category.getActiveCategories();
    const categoriesWithStats = await Promise.all(
      categories.map(category => category.toJSONWithStats())
    );
    return categoriesWithStats;
  };

  // Associations will be defined in index.js
  Category.associate = function(models) {
    Category.hasMany(models.Question, {
      foreignKey: 'categoryId',
      as: 'questions'
    });
  };

  return Category;
};