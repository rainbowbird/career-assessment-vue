import { prisma } from '../src/index.js'
import bcrypt from 'bcryptjs'

// 定义题目数据
const questionsData = [
  // 1-4: 沟通表达 (COMMUNICATION)
  {
    order: 1,
    scenario: '你刚加入一个项目组，第一次团队会议上，组长分配的任务与你的专业方向不太一致。',
    content: '你会怎么做？',
    dimension: 'COMMUNICATION',
    options: [
      { content: '先按分配的任务执行，在实践中逐步了解其与专业的关联', score: 60 },
      { content: '私下与有经验的同事交流，了解该任务的背景和意义', score: 70 },
      { content: '在会议讨论环节，分享自己的专业方向，探讨可能的调整', score: 90 },
      { content: '先接受任务，同时在工作中寻找将专业知识融入其中的机会', score: 80 },
      { content: '会后与组长单独沟通，说明自己的专业优势，探讨更合适的分工', score: 85 }
    ]
  },
  {
    order: 2,
    scenario: '在远程线上会议中，你发现自己的观点被其他同事误解，并且讨论朝着错误方向发展。',
    content: '你会如何处理？',
    dimension: 'COMMUNICATION',
    options: [
      { content: '等待会议休息时，私下与关键人物澄清自己的观点', score: 50 },
      { content: '在聊天区发送简短文字，纠正误解的核心点', score: 70 },
      { content: '抓住发言机会，用不同的表达方式重新阐述自己的观点', score: 90 },
      { content: '先肯定讨论中的合理部分，再引导到正确的理解上', score: 85 },
      { content: '请求主持人给予简短时间，用具体例子说明自己的原意', score: 80 }
    ]
  },
  {
    order: 3,
    scenario: '你的导师/上级用专业术语布置了一项任务，其中有几个关键点你不太理解。',
    content: '你会怎么做？',
    dimension: 'COMMUNICATION',
    options: [
      { content: '先记录下任务要点，尝试通过网络搜索理解专业术语', score: 60 },
      { content: '向同学/同事请教这些术语的含义，再开始着手任务', score: 70 },
      { content: '按照自己的理解先行动，遇到具体问题再请教', score: 50 },
      { content: '礼貌地请导师/上级用更通俗的语言解释不明确的地方', score: 90 },
      { content: '先查阅相关资料形成初步理解，再带着具体问题请教', score: 80 }
    ]
  },
  {
    order: 4,
    scenario: '在小组项目展示前，你发现同组成员准备的部分内容与整体主题有偏差。时间已经很紧张了。',
    content: '你会如何处理？',
    dimension: 'COMMUNICATION',
    options: [
      { content: '考虑时间限制，建议保持原样，展示时强调一致的部分', score: 40 },
      { content: '与该成员快速沟通，了解其想法，寻找折中的呈现方式', score: 80 },
      { content: '向组长反映情况，由组长协调是否需要调整', score: 70 },
      { content: '主动提出协助修改，确保内容与主题一致', score: 90 },
      { content: '建议在展示时增加过渡说明，使偏差内容与主题更好衔接', score: 75 }
    ]
  },

  // 5-8: 团队协作 (TEAMWORK)
  {
    order: 5,
    scenario: '在团队项目中，有位成员经常迟到或缺席会议，影响了项目进度。',
    content: '作为团队一员，你会怎么做？',
    dimension: 'TEAMWORK',
    options: [
      { content: '记录每次会议要点，会后主动分享给该成员，确保其了解进展', score: 70 },
      { content: '私下询问该成员是否有困难，看是否能提供帮助', score: 80 },
      { content: '向团队负责人反映情况，由负责人处理', score: 60 },
      { content: '在团队会议上提出建立明确的考勤和进度跟踪机制', score: 85 },
      { content: '尝试重新分配任务，减少该成员缺席对整体进度的影响', score: 90 }
    ]
  },
  {
    order: 6,
    scenario: '团队讨论中出现了两种不同的解决方案，各有优缺点，大家意见不一。',
    content: '你倾向于其中一种方案，但支持者较少。你会怎么做？',
    dimension: 'TEAMWORK',
    options: [
      { content: '尊重多数人的选择，积极参与执行被选中的方案', score: 80 },
      { content: '提出进行小规模测试，用实际结果来评估两种方案', score: 90 },
      { content: '尝试整合两种方案的优点，提出新的折中方案', score: 85 },
      { content: '坚持表达自己的观点和理由，直到讨论结束', score: 50 },
      { content: '建议按不同方案分工推进，后期再合并最优成果', score: 75 }
    ]
  },
  {
    order: 7,
    scenario: '团队项目即将截止，但有部分任务未能按时完成。',
    content: '作为团队成员，你已经完成了自己的部分。你会怎么做？',
    dimension: 'TEAMWORK',
    options: [
      { content: '相信其他成员能完成自己的任务，不主动介入', score: 30 },
      { content: '询问未完成任务的成员是否需要帮助，根据自己的能力提供支持', score: 80 },
      { content: '建议团队召开紧急会议，重新分配剩余任务', score: 70 },
      { content: '主动承担一部分未完成的任务，确保项目按时提交', score: 90 },
      { content: '帮助分析延迟原因，提供资源或方法上的建议', score: 85 }
    ]
  },
  {
    order: 8,
    scenario: '在团队合作中，你发现自己的工作成果被其他成员错误地归功于自己。',
    content: '你会如何处理？',
    dimension: 'TEAMWORK',
    options: [
      { content: '不特别指出，认为团队成果比个人功劳更重要', score: 60 },
      { content: '私下向该成员说明实际情况，避免误会', score: 70 },
      { content: '在适当场合自然地提及各成员的具体贡献', score: 85 },
      { content: '请团队负责人在总结时说明每个人的贡献', score: 80 },
      { content: '认为这只是偶然失误，不需要特别处理', score: 40 }
    ]
  },

  // 9-12: 问题解决 (PROBLEM_SOLVING)
  {
    order: 9,
    scenario: '你负责的一个课程作业需要使用一种你不熟悉的软件工具，而截止日期临近。',
    content: '你会如何解决这个问题？',
    dimension: 'PROBLEM_SOLVING',
    options: [
      { content: '寻找是否有功能相似且自己熟悉的替代工具', score: 60 },
      { content: '快速浏览基础教程，边学边做，优先完成核心功能', score: 80 },
      { content: '请教熟悉该软件的同学，获取关键操作指导', score: 85 },
      { content: '将任务分解为小块，逐个学习完成每个部分所需的技能', score: 90 },
      { content: '向老师说明情况，询问是否可以采用其他方式完成', score: 50 }
    ]
  },
  {
    order: 10,
    scenario: '在准备一场重要的展示时，你发现原本计划使用的数据存在错误，而重新收集数据已经来不及了。',
    content: '你会怎么做？',
    dimension: 'PROBLEM_SOLVING',
    options: [
      { content: '取消使用该部分数据，调整展示重点到其他可靠内容', score: 70 },
      { content: '在展示中说明数据的局限性，同时提供可能的解释', score: 60 },
      { content: '寻找替代数据源，即使不够理想也比错误数据好', score: 80 },
      { content: '重新分析现有数据，找出其他有意义的发现', score: 90 },
      { content: '坦诚说明情况，将重点放在分析方法而非具体数据上', score: 85 }
    ]
  },
  {
    order: 11,
    scenario: '你和同学合作完成一个项目，在执行过程中发现最初的方案存在重大缺陷。',
    content: '你会如何处理？',
    dimension: 'PROBLEM_SOLVING',
    options: [
      { content: '继续按原方案执行，同时记录问题，在总结时提及', score: 30 },
      { content: '暂停执行，组织团队重新评估方案，找出问题根源', score: 80 },
      { content: '寻找最小改动方案，在现有基础上修复缺陷', score: 85 },
      { content: '请教老师或专业人士，获取解决方案建议', score: 75 },
      { content: '快速评估多个可能的解决方案，选择最优的一个实施', score: 90 }
    ]
  },
  {
    order: 12,
    scenario: '在求职过程中，你收到两个公司的offer，各有优缺点，难以抉择。',
    content: '你会如何做决定？',
    dimension: 'PROBLEM_SOLVING',
    options: [
      { content: '列出自己最看重的因素，给每个offer打分，选择分数高的', score: 90 },
      { content: '咨询行业内的前辈，听取他们对两家公司的评价', score: 85 },
      { content: '凭直觉选择一个自己感觉更合适的', score: 50 },
      { content: '尝试联系两家公司的员工，了解内部工作环境', score: 80 },
      { content: '设定决策期限，在期限前综合所有信息做出选择', score: 85 }
    ]
  },

  // 13-16: 学习适应 (LEARNING)
  {
    order: 13,
    scenario: '你参加了一个行业讲座，内容涉及很多你不熟悉的专业术语和概念。',
    content: '你会如何处理这些新知识？',
    dimension: 'LEARNING',
    options: [
      { content: '记录下关键术语，讲座后逐一查阅理解', score: 80 },
      { content: '向同行或老师请教不懂的问题，获取解释', score: 85 },
      { content: '根据讲座内容，制定后续系统学习的计划', score: 90 },
      { content: '寻找相关的入门资料，从基础开始学习', score: 75 },
      { content: '加入相关的学习社区，与他人交流讨论这些新概念', score: 85 }
    ]
  },
  {
    order: 14,
    scenario: '你学习了一个新的编程技能，但在实际应用时遇到了无法解决的错误。',
    content: '你会如何处理？',
    dimension: 'LEARNING',
    options: [
      { content: '反复检查代码，尝试不同的写法，直到解决问题', score: 70 },
      { content: '在网上搜索错误信息，寻找解决方案', score: 80 },
      { content: '结构化地分析问题，逐步缩小可能的错误范围', score: 90 },
      { content: '向有经验的开发者请教，展示自己已尝试的方法', score: 85 },
      { content: '暂时搁置该问题，先学习相关的基础知识，再回头解决', score: 60 }
    ]
  },
  {
    order: 15,
    scenario: '为了准备毕业设计，你需要学习一个全新的研究领域。',
    content: '你会如何规划自己的学习？',
    dimension: 'LEARNING',
    options: [
      { content: '按照导师提供的资料，按部就班地学习', score: 70 },
      { content: '先快速浏览相关文献，了解该领域的基本框架和热点', score: 90 },
      { content: '从经典教材入手，系统学习该领域的基础知识', score: 80 },
      { content: '先确定研究问题，再有针对性地查找和学习相关资料', score: 85 },
      { content: '寻找该领域的在线课程，跟随课程进度学习', score: 75 }
    ]
  },
  {
    order: 16,
    scenario: '你发现同专业的同学都在学习一项新技能，而你对此几乎一无所知。',
    content: '你会如何应对？',
    dimension: 'LEARNING',
    options: [
      { content: '观察一段时间，了解这项技能的应用价值后再决定是否学习', score: 70 },
      { content: '立即开始学习，不想落后于同学', score: 50 },
      { content: '评估该技能与自己职业规划的相关性，再决定学习优先级', score: 90 },
      { content: '找到入门资源，每天安排固定时间学习', score: 85 },
      { content: '与正在学习的同学交流，获取学习经验和资源推荐', score: 80 }
    ]
  },

  // 17-20: 情绪管理 (EMOTIONAL)
  {
    order: 17,
    scenario: '期末周来临，你有多个考试和论文需要完成，感到压力很大。',
    content: '你会如何应对？',
    dimension: 'EMOTIONAL',
    options: [
      { content: '按照截止日期排序，先完成最紧急的任务', score: 70 },
      { content: '制定详细的学习计划，合理分配时间给每个任务', score: 85 },
      { content: '每天安排固定的休息和放松时间，保持规律作息', score: 90 },
      { content: '先集中精力完成自己最擅长的科目，再处理其他任务', score: 75 },
      { content: '寻求同学互助，共同复习或讨论论文思路，减轻压力', score: 85 }
    ]
  },
  {
    order: 18,
    scenario: '在一次重要的项目展示后，老师/评委对你的作品提出了严厉的批评和改进建议。',
    content: '你会如何反应？',
    dimension: 'EMOTIONAL',
    options: [
      { content: '认真记录所有批评意见，暂时不做辩解', score: 85 },
      { content: '感到沮丧，但会尝试从批评中找到有价值的建议', score: 70 },
      { content: '当场感谢评委的意见，并简要说明自己的想法', score: 80 },
      { content: '先冷静下来，稍后再仔细分析批评的合理性', score: 90 },
      { content: '主动与老师/评委预约，深入了解具体的改进方向', score: 85 }
    ]
  },
  {
    order: 19,
    scenario: '你同时负责两个重要项目，都需要在差不多的时间完成，而你发现很难同时保证两者的质量。',
    content: '你会如何处理？',
    dimension: 'EMOTIONAL',
    options: [
      { content: '评估两个项目的核心要求，合理分配时间和精力', score: 90 },
      { content: '向负责人说明情况，请求调整其中一个项目的截止时间', score: 80 },
      { content: '优先保证自己更擅长的项目质量，另一个尽力而为', score: 60 },
      { content: '寻找可能的资源或人员协助，分担部分工作', score: 85 },
      { content: '延长工作时间，牺牲部分休息，努力同时保证两个项目的质量', score: 50 }
    ]
  },
  {
    order: 20,
    scenario: '你准备了很久的面试，结果没有通过。',
    content: '你会如何调整自己的状态？',
    dimension: 'EMOTIONAL',
    options: [
      { content: '允许自己短暂失落，然后分析面试中可能的不足', score: 90 },
      { content: '立即投入下一个面试的准备，不让自己沉溺于失败', score: 70 },
      { content: '向有经验的人请教，了解自己可能存在的问题', score: 85 },
      { content: '反思自己的职业定位，是否与所面试的岗位匹配', score: 80 },
      { content: '总结经验教训，制定针对性的改进计划', score: 90 }
    ]
  },

  // 21-24: 时间管理 (TIME_MANAGEMENT)
  {
    order: 21,
    scenario: '你有一个月时间完成一篇课程论文，但你总是拖延，直到最后一周才开始。',
    content: '你会如何处理？',
    dimension: 'TIME_MANAGEMENT',
    options: [
      { content: '接受自己的拖延习惯，利用最后一周高效完成', score: 40 },
      { content: '制定最后一周的详细计划，每天完成固定部分', score: 70 },
      { content: '评估论文要求，调整范围，确保能按时完成', score: 75 },
      { content: '寻求同学帮助，分担部分查阅资料的工作', score: 65 },
      { content: '从这次经历中吸取教训，下次提前规划', score: 80 }
    ]
  },
  {
    order: 22,
    scenario: '你原本计划好周末完成作业和复习，但突然接到朋友的邀请参加一个难得的活动。',
    content: '你会如何选择？',
    dimension: 'TIME_MANAGEMENT',
    options: [
      { content: '坚持原计划学习，错过这次活动', score: 60 },
      { content: '接受邀请参加活动，学习任务推迟到下周', score: 40 },
      { content: '参加活动，但缩短时间，其余时间用来学习', score: 75 },
      { content: '评估作业量和重要性，再决定是否参加活动', score: 85 },
      { content: '提前完成部分学习任务，确保既能参加活动又不影响学习', score: 90 }
    ]
  },
  {
    order: 23,
    scenario: '你每天都觉得很忙，但总感觉没有完成什么重要的事情。',
    content: '你会如何改善这种情况？',
    dimension: 'TIME_MANAGEMENT',
    options: [
      { content: '记录一周的时间使用情况，分析时间浪费在哪里', score: 90 },
      { content: '学习时间管理方法，按重要性和紧急性安排任务', score: 85 },
      { content: '减少社交媒体使用时间，增加专注工作的时间', score: 75 },
      { content: '每天只设定2-3个最重要的目标，确保完成', score: 85 },
      { content: '尝试番茄工作法等时间管理技巧，提高专注度', score: 80 }
    ]
  },
  {
    order: 24,
    scenario: '在学习或工作时，你经常被手机通知、社交媒体等干扰，影响效率。',
    content: '你会如何应对？',
    dimension: 'TIME_MANAGEMENT',
    options: [
      { content: '将手机调至静音模式，放在视线之外', score: 85 },
      { content: '使用专注软件，限制自己使用社交媒体的时间', score: 80 },
      { content: '设定固定的时间查看手机，其他时间专注工作', score: 90 },
      { content: '将大任务分解为小任务，每完成一个小任务奖励自己查看手机', score: 75 },
      { content: '尝试提高自己的抗干扰能力，训练在有干扰的环境下工作', score: 60 }
    ]
  },

  // 25-27: 领导力 (LEADERSHIP)
  {
    order: 25,
    scenario: '你负责的小组项目中，由于你的疏忽导致了一个错误，影响了整体结果。',
    content: '你会如何处理？',
    dimension: 'LEADERSHIP',
    options: [
      { content: '主动承认错误，并提出具体的补救措施', score: 90 },
      { content: '分析错误原因，确保将来不再犯类似错误', score: 85 },
      { content: '向团队道歉，承担相应的责任和后果', score: 80 },
      { content: '除了纠正错误，还思考如何改进流程预防类似问题', score: 90 },
      { content: '与团队一起解决问题，将影响降到最低', score: 85 }
    ]
  },
  {
    order: 26,
    scenario: '你答应帮助同学完成一个任务，但后来发现自己时间不够，可能无法按时完成。',
    content: '你会如何处理？',
    dimension: 'LEADERSHIP',
    options: [
      { content: '提前告知同学情况，看是否可以延期或寻找替代方案', score: 90 },
      { content: '尽自己所能完成一部分，并详细说明未完成部分', score: 75 },
      { content: '推荐其他可能有时间的同学来协助完成', score: 80 },
      { content: '调整自己的时间安排，优先保证完成承诺的任务', score: 85 },
      { content: '坦诚说明情况，道歉并解释原因', score: 80 }
    ]
  },
  {
    order: 27,
    scenario: '在实习期间，你发现公司的一个流程存在问题，可能导致效率低下，但这不属于你负责的范围。',
    content: '你会怎么做？',
    dimension: 'LEADERSHIP',
    options: [
      { content: '认为与自己无关，不采取任何行动', score: 20 },
      { content: '观察一段时间，确认问题后再向相关人员反映', score: 70 },
      { content: '向直属领导提出自己的观察和改进建议', score: 85 },
      { content: '不仅指出问题，还会提出具体的改进方案供参考', score: 90 },
      { content: '先了解该流程的背景和原因，再决定是否提出建议', score: 80 }
    ]
  },

  // 28-30: 职业认知 (CAREER_AWARENESS)
  {
    order: 28,
    scenario: '你刚转到一个新的班级/部门，发现这里的学习/工作方式与你之前习惯的有很大不同。',
    content: '你会如何适应？',
    dimension: 'CAREER_AWARENESS',
    options: [
      { content: '观察和学习新环境的规则和文化，逐步调整自己', score: 85 },
      { content: '坚持自己原来的有效方法，同时尝试融入新环境', score: 75 },
      { content: '主动与新同学/同事交流，了解他们的工作方式和习惯', score: 90 },
      { content: '向有经验的成员请教，获取适应新环境的建议', score: 85 },
      { content: '积极参与集体活动，快速熟悉新环境和新成员', score: 80 }
    ]
  },
  {
    order: 29,
    scenario: '学校/公司突然宣布改变一项重要的政策或流程，你认为新政策可能会给自己带来不便。',
    content: '你会如何反应？',
    dimension: 'CAREER_AWARENESS',
    options: [
      { content: '虽然不认同，但还是会按要求执行，适应新政策', score: 75 },
      { content: '了解政策改变的原因，尝试理解其合理性和必要性', score: 85 },
      { content: '向相关部门反馈自己的困难和建议，但仍会遵守新政策', score: 90 },
      { content: '积极调整自己的工作方式，寻找在新政策下提高效率的方法', score: 90 },
      { content: '与同事/同学交流，分享适应新政策的经验和技巧', score: 85 }
    ]
  },
  {
    order: 30,
    scenario: '你被安排与一位工作风格与你截然不同的同学/同事合作完成一个项目。',
    content: '你会如何处理？',
    dimension: 'CAREER_AWARENESS',
    options: [
      { content: '尊重对方的工作风格，尽量配合对方的节奏', score: 80 },
      { content: '明确分工，各自负责擅长的部分，保持必要的沟通', score: 85 },
      { content: '尝试理解对方工作方式的优点，调整自己的方法', score: 90 },
      { content: '寻找双方都能接受的工作方式，形成互补', score: 90 },
      { content: '以项目目标为导向，暂时放下个人偏好，优先保证项目成功', score: 85 }
    ]
  },

  // 31: 创新思维 (INNOVATION)
  {
    order: 31,
    scenario: '你收到两份工作邀请：一份是知名大公司的基础岗位，薪资一般；另一份是创业公司的核心岗位，薪资较高但风险也大。',
    content: '你会如何选择？',
    dimension: 'INNOVATION',
    options: [
      { content: '选择大公司，看重其稳定的发展平台和培训体系', score: 70 },
      { content: '选择创业公司，看重其成长空间和全面锻炼的机会', score: 75 },
      { content: '根据自己的职业规划和风险承受能力做决定', score: 90 },
      { content: '考虑行业前景，选择更有发展潜力的行业', score: 85 },
      { content: '优先考虑工作内容与个人兴趣和专业的匹配度', score: 85 }
    ]
  }
]

async function main() {
  console.log('开始初始化数据库...')

  // 创建默认管理员账号
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  await prisma.admin.upsert({
    where: { id: 'default-admin' },
    update: {},
    create: {
      id: 'default-admin',
      password: hashedPassword
    }
  })
  
  console.log('管理员账号已创建')

  // 清理旧数据
  await prisma.answer.deleteMany()
  await prisma.option.deleteMany()
  await prisma.question.deleteMany()
  
  console.log('已清理旧题目数据')

  // 创建题目和选项
  for (const q of questionsData) {
    const question = await prisma.question.create({
      data: {
        order: q.order,
        scenario: q.scenario,
        content: q.content
      }
    })

    // 创建选项
    for (let i = 0; i < q.options.length; i++) {
      const opt = q.options[i]
      await prisma.option.create({
        data: {
          questionId: question.id,
          order: i + 1,
          content: opt.content,
          score: opt.score,
          dimension: q.dimension as any
        }
      })
    }

    console.log(`题目 ${q.order} 已创建 (${q.dimension})`)
  }

  console.log(`数据库初始化完成！共创建 ${questionsData.length} 道题目`)
}

main()
  .catch((e) => {
    console.error('初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
