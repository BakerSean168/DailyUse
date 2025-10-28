const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'apps/web/src/modules/goal/application/services/GoalWebApplicationService.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// 替换所有的 Goal.fromClientDTO 为 GoalClient.fromClientDTO
content = content.replace(/\bGoal\.fromClientDTO/g, 'GoalClient.fromClientDTO');

// 替换所有的 GoalFolder.fromClientDTO 为 GoalFolderClient.fromClientDTO
content = content.replace(/\bGoalFolder\.fromClientDTO/g, 'GoalFolderClient.fromClientDTO');

// 替换 API 客户端导入和使用
content = content.replace(/GoalFolderApiClient/g, 'goalFolderApiClient');

// 替换方法名
content = content.replace(/async createGoalFolder\(/g, 'async createGoalFolder(');
content = content.replace(/async getGoalFolders\(/g, 'async getGoalFolders(');
content = content.replace(/async updateGoalFolder\(/g, 'async updateGoalFolder(');
content = content.replace(/async deleteGoalFolder\(/g, 'async deleteGoalFolder(');
content = content.replace(/async refreshGoalFolders\(/g, 'async refreshGoalFolders(');

// 替换注释
content = content.replace(/\/\/ ===== GoalFolder 管理 =====/g, '// ===== GoalFolder 管理 =====');

// 替换类型引用
content = content.replace(/GoalContracts\.CreateGoalFolderRequest/g, 'GoalContracts.CreateGoalFolderRequest');
content = content.replace(/GoalContracts\.UpdateGoalFolderRequest/g, 'GoalContracts.UpdateGoalFolderRequest');
content = content.replace(/GoalContracts\.GoalFolderClientDTO/g, 'GoalContracts.GoalFolderClientDTO');
content = content.replace(/GoalContracts\.GoalFolderListResponse/g, 'GoalContracts.GoalFoldersResponse');

// 替换变量名
content = content.replace(/const GoalFolder = /g, 'const goalFolder = ');
content = content.replace(/const GoalFolders = /g, 'const goalFolders = ');
content = content.replace(/\.addOrUpdateGoalFolder\(/g, '.addOrUpdateGoalFolder(');
content = content.replace(/\.setGoalFolders\(/g, '.setGoalFolders(');
content = content.replace(/\.removeGoalFolder\(/g, '.removeGoalFolder(');

// 替换计数变量
content = content.replace(/GoalFoldersCount/g, 'goalFoldersCount');
content = content.replace(/GoalFoldersData/g, 'goalFoldersData');
content = content.replace(/GoalFoldersType/g, 'goalFoldersType');
content = content.replace(/GoalFoldersDataStructure/g, 'goalFoldersDataStructure');

fs.writeFileSync(filePath, content);
console.log('✅ GoalWebApplicationService.ts updated successfully');
