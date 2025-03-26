const express = require('express');
const router = express.Router();
const knex = require('../database/knex');

// 获取专家列表，包含专业分类和状态
router.get('/', async (req, res) => {
  try {
    // 获取所有角色为2的用户（专家）
    const experts = await knex('users')
      .where('role', 2)
      .select('id', 'username', 'email', 'profile_image', 'biography');
    
    // 对每个专家，获取其专业分类和状态
    const expertsWithDetails = await Promise.all(experts.map(async (expert) => {
      // 获取专家的专业分类
      const specializations = await knex('expert_specializations')
        .where('user_id', expert.id)
        .join('categories', 'expert_specializations.category_id', 'categories.id')
        .select('categories.id', 'categories.name');
      
      // 获取专家的状态
      const statusRecord = await knex('expert_status')
        .where('user_id', expert.id)
        .first();
      
      return {
        ...expert,
        specializations: specializations.map(s => s.id), // 只返回ID列表
        specializationNames: specializations.map(s => s.name), // 同时返回名称列表便于显示
        status: statusRecord ? statusRecord.status : 'Available' // 默认为Available
      };
    }));
    
    return res.json({
      success: true,
      experts: expertsWithDetails
    });
  } catch (error) {
    console.error('获取专家列表失败:', error);
    return res.status(500).json({
      success: false,
      error: '获取专家列表失败'
    });
  }
});

// 获取专家详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 获取专家基本信息
    const expert = await knex('users')
      .where({ id, role: 2 })
      .select('id', 'username', 'email', 'profile_image', 'biography')
      .first();
    
    if (!expert) {
      return res.status(404).json({
        success: false,
        error: '未找到专家'
      });
    }
    
    // 获取专家的专业分类
    const specializations = await knex('expert_specializations')
      .where('user_id', id)
      .join('categories', 'expert_specializations.category_id', 'categories.id')
      .select('categories.id', 'categories.name');
    
    // 获取专家的状态
    const statusRecord = await knex('expert_status')
      .where('user_id', id)
      .first();
    
    return res.json({
      success: true,
      expert: {
        ...expert,
        specializations: specializations.map(s => s.id),
        specializationNames: specializations.map(s => s.name),
        status: statusRecord ? statusRecord.status : 'Available'
      }
    });
  } catch (error) {
    console.error('获取专家详情失败:', error);
    return res.status(500).json({
      success: false,
      error: '获取专家详情失败'
    });
  }
});

// 更新专家状态 - 需要认证
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // 验证状态值
    const validStatuses = ['Available', 'Busy', 'Away'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: '无效的状态值，必须是 Available, Busy 或 Away'
      });
    }
    
    // 检查专家是否存在
    const expert = await knex('users')
      .where({ id, role: 2 })
      .first();
    
    if (!expert) {
      return res.status(404).json({
        success: false,
        error: '未找到专家'
      });
    }
    
    // 更新或插入状态记录
    const existingStatus = await knex('expert_status')
      .where('user_id', id)
      .first();
    
    if (existingStatus) {
      await knex('expert_status')
        .where('user_id', id)
        .update({
          status,
          updated_at: knex.fn.now()
        });
    } else {
      await knex('expert_status').insert({
        user_id: id,
        status,
        updated_at: knex.fn.now()
      });
    }
    
    return res.json({
      success: true,
      message: '专家状态已更新'
    });
  } catch (error) {
    console.error('更新专家状态失败:', error);
    return res.status(500).json({
      success: false,
      error: '更新专家状态失败'
    });
  }
});

// 获取所有专家列表信息
router.get("/list", async (req, res) => {
  try {
    console.log("开始获取专家列表");
    
    // 检查所有必要的表是否存在
    const expertDataExists = await knex.schema.hasTable('expert_data');
    const expertSpecializationsExists = await knex.schema.hasTable('expert_specializations');
    const categoriesExists = await knex.schema.hasTable('categories');
    const expertStatusExists = await knex.schema.hasTable('expert_status');
    
    console.log('表存在性检查:', {
      expert_data: expertDataExists,
      expert_specializations: expertSpecializationsExists,
      categories: categoriesExists,
      expert_status: expertStatusExists
    });
    
    // 获取所有专家用户(role=2)
    const experts = await knex("users")
      .where("role", 2)
      .select("id", "username");
    
    console.log(`找到${experts.length}个专家用户:`, experts);
    
    // 获取每个专家的详细信息
    const expertsWithDetails = [];
    
    for (const expert of experts) {
      console.log(`处理专家ID: ${expert.id}`);
      
      // 基本信息对象
      const expertDetail = {
        id: expert.id,
        username: expert.username,
        display_name: expert.username, // 默认使用用户名
        specializations: [],
        specializationNames: [],
        status: "Available" // 默认状态
      };
      
      // 添加专家详细信息
      if (expertDataExists) {
        try {
          const expertData = await knex("expert_data")
            .where("user_id", expert.id)
            .first();
          
          console.log(`专家${expert.id}的详细数据:`, expertData);
          
          if (expertData && expertData.display_name) {
            expertDetail.display_name = expertData.display_name;
          }
        } catch (dataError) {
          console.error(`获取专家${expert.id}的详细数据失败:`, dataError);
        }
      }
      
      // 添加专家状态
      if (expertStatusExists) {
        try {
          const statusRecord = await knex("expert_status")
            .where("user_id", expert.id)
            .first();
          
          console.log(`专家${expert.id}的状态:`, statusRecord);
          
          if (statusRecord) {
            expertDetail.status = statusRecord.status;
          }
        } catch (statusError) {
          console.error(`获取专家${expert.id}的状态失败:`, statusError);
        }
      }
      
      // 添加专家专业领域
      if (expertSpecializationsExists && categoriesExists) {
        try {
          // 先只获取专业ID，不进行连接
          const specializations = await knex("expert_specializations")
            .where("user_id", expert.id)
            .select("category_id");
          
          console.log(`专家${expert.id}的专业领域ID:`, specializations);
          
          if (specializations && specializations.length > 0) {
            // 获取专业领域ID
            expertDetail.specializations = specializations.map(s => s.category_id);
            
            // 根据ID获取专业名称
            const categoryNames = await knex("categories")
              .whereIn("id", expertDetail.specializations)
              .select("id", "name");
              
            console.log(`专家${expert.id}的专业领域名称:`, categoryNames);
            
            expertDetail.specializationNames = categoryNames.map(c => c.name);
          }
        } catch (specError) {
          console.error(`获取专家${expert.id}的专业领域失败:`, specError);
        }
      }
      
      // 添加到结果列表
      expertsWithDetails.push(expertDetail);
    }
    
    console.log("专家详细信息处理完成");
    res.json({ experts: expertsWithDetails });
  } catch (error) {
    console.error("获取专家列表失败，详细错误:", error);
    console.error("错误堆栈:", error.stack);
    res.status(500).json({ error: "服务器错误" });
  }
});

module.exports = router; 