/* ============================================================
   师作 TeachDo B02 · 课题目录库（自 B01 app/js/catalog.js 机械转换）
   K12 全学段：学段→学科→学制→版本→年级→册→单元→课题→分课
   原则：默认人教版（统编版语文/道法/历史）；分课反映实际教学
   拆分（课本一节 ≠ 实际一课时），与单元课标对齐。
   ============================================================ */

export interface Lesson { title: string; parts?: string[] }
export interface Unit { unit: string; lessons: Lesson[] }
export type BookCatalog = Record<string, Unit[]>;           // gradeKey → 单元列表
export type SubjectCatalog = Record<string, BookCatalog>;   // 版本 → 册
export type StageCatalog = Record<string, SubjectCatalog>;  // 学科 → 版本
export type CatalogRoot = Record<string, StageCatalog>;     // 学段 → 学科
/* ---------- 学段 → 学科（严格互斥） ---------- */
export const subjects: Record<string, string[]> = {
  "小学":["语文","数学","英语","道德与法治","科学","音乐","体育与健康","美术","信息科技","劳动","综合实践活动"],
  "初中":["语文","数学","英语","物理","化学","生物","历史","地理","道德与法治","音乐","体育与健康","美术","信息科技"],
  "高中":["语文","数学","英语","日语","俄语","物理","化学","生物","历史","地理","思想政治","信息技术","通用技术","音乐","体育与健康","美术"],
  "大学":[] /* 大学走专业库 */
};

/* ---------- 学制 ---------- */
export const systems: string[] = ["六三制","五四制"];

/* 学段+学制 → 年级序列 */
export function grades(stage: string, system: string): string[]{
  if(stage==="小学") return system==="五四制" ? ["一年级","二年级","三年级","四年级","五年级"] : ["一年级","二年级","三年级","四年级","五年级","六年级"];
  if(stage==="初中") return system==="五四制" ? ["六年级","七年级","八年级","九年级"] : ["七年级","八年级","九年级"];
  if(stage==="高中") return ["高一","高二","高三"];
  return [];
};
export const terms: string[] = ["上册","下册"];

/* ---------- 学科 → 教材版本（默认第 1 个为人教版系） ---------- */
export const versions: Record<string, string[]> = {
  "语文":["统编版（人教）","人教版（旧）","语文版","苏教版","北师大版"],
  "数学":["人教版","北师大版","苏教版","西师大版","冀教版","青岛版","沪教版","北京版"],
  "英语":["人教PEP版","人教精通版","外研版（三起）","外研版（一起）","译林版","沪教牛津版","冀教版","北师大版","闽教版","湘少版","科普版","重大版"],
  "物理":["人教版","北师大版","沪科版","教科版","粤沪版","苏科版","沪粤版"],
  "化学":["人教版","鲁教版","沪教版","科粤版","北京版","仁爱版"],
  "生物":["人教版","北师大版","苏教版","苏科版","济南版","冀少版","北京版"],
  "历史":["统编版（人教）","人教版（旧）","北师大版","川教版","岳麓版","华东师大版"],
  "地理":["人教版","湘教版","中图版","商务星球版","粤教版","晋教版","鲁教版"],
  "道德与法治":["统编版（人教）"],
  "思想政治":["统编版（人教）"],
  "科学":["教科版","苏教版","冀人版","青岛版","大象版","湘科版","人教鄂教版"],
  "日语":["人教版","新标准日本语教程"],
  "俄语":["人教版"],
  "音乐":["人教版","人音版","湘艺版","花城版","苏少版","人教版（简谱）"],
  "美术":["人教版","人美版","湘美版","岭南版","苏少版","浙美版"],
  "体育与健康":["人教版","华东师大版","科学版"],
  "信息科技":["人教版","浙教版","教科版","川教版","粤教版"],
  "信息技术":["人教版","浙教版","教科版","粤教版","沪科教版","中图版"],
  "通用技术":["苏教版","地质版","粤科版","人教版"],
  "劳动":["人教版","浙教版"],
  "综合实践活动":["纲要指导（自编）"]
};

/* ============================================================
   课题目录
   键：catalog[stage][subject][version][gradeKey]
   gradeKey = 年级+册，如 "三上" / "七下" / "必修一"
   值：units: [{unit:"单元名", lessons:[{title:"课题", parts:["实际分课"...]}]}]
   版本无独立目录时回落到该学科第一个版本（人教版系）。
   ============================================================ */
const catalog: CatalogRoot = { "小学":{}, "初中":{}, "高中":{} };

/* ———————— 小学数学（人教版） ———————— */
catalog["小学"]["数学"] = { "人教版":{
"一上":[{unit:"准备课",lessons:[{title:"数一数"},{title:"比多少"}]},
 {unit:"位置",lessons:[{title:"上、下、前、后"},{title:"左、右"}]},
 {unit:"1-5的认识和加减法",lessons:[{title:"1-5的认识",parts:["1-5的认识","比大小","第几","分与合"]},{title:"加法"},{title:"减法"},{title:"0的认识和加减法"}]},
 {unit:"认识图形（一）",lessons:[{title:"认识立体图形"}]},
 {unit:"6-10的认识和加减法",lessons:[{title:"6和7",parts:["6和7的认识","6和7的加减法","解决问题"]},{title:"8和9"},{title:"10"},{title:"连加、连减"},{title:"加减混合"}]},
 {unit:"11-20各数的认识",lessons:[{title:"11-20各数的认识",parts:["数数、读数","数的组成与数位","10加几与相应减法"]}]},
 {unit:"认识钟表",lessons:[{title:"认识整时"}]},
 {unit:"20以内的进位加法",lessons:[{title:"9加几"},{title:"8、7、6加几"},{title:"5、4、3、2加几"},{title:"解决问题"}]}],
"一下":[{unit:"认识图形（二）",lessons:[{title:"认识平面图形"}]},
 {unit:"20以内的退位减法",lessons:[{title:"十几减9"},{title:"十几减8、7、6"},{title:"十几减5、4、3、2"},{title:"解决问题"}]},
 {unit:"分类与整理",lessons:[{title:"分类与整理"}]},
 {unit:"100以内数的认识",lessons:[{title:"数数 数的组成"},{title:"读数 写数"},{title:"数的顺序 比较大小"},{title:"整十数加一位数及相应的减法"}]},
 {unit:"认识人民币",lessons:[{title:"认识人民币"},{title:"简单的计算"}]},
 {unit:"100以内的加法和减法（一）",lessons:[{title:"整十数加、减整十数"},{title:"两位数加一位数、整十数"},{title:"两位数减一位数、整十数"}]},
 {unit:"找规律",lessons:[{title:"找规律"}]}],
"二上":[{unit:"长度单位",lessons:[{title:"认识厘米 用厘米量"},{title:"认识米 用米量"},{title:"认识线段"},{title:"解决问题"}]},
 {unit:"100以内的加法和减法（二）",lessons:[{title:"不进位加"},{title:"进位加"},{title:"不退位减"},{title:"退位减"},{title:"连加、连减和加减混合"}]},
 {unit:"角的初步认识",lessons:[{title:"角的初步认识"},{title:"认识直角、锐角和钝角"}]},
 {unit:"表内乘法（一）",lessons:[{title:"乘法的初步认识"},{title:"5的乘法口诀"},{title:"2、3、4的乘法口诀"},{title:"乘加 乘减"},{title:"6的乘法口诀"}]},
 {unit:"观察物体（一）",lessons:[{title:"观察物体"}]},
 {unit:"表内乘法（二）",lessons:[{title:"7的乘法口诀"},{title:"8的乘法口诀"},{title:"9的乘法口诀"},{title:"解决问题"}]},
 {unit:"认识时间",lessons:[{title:"认识几时几分"}]},
 {unit:"数学广角——搭配（一）",lessons:[{title:"简单的排列与组合"}]}],
"二下":[{unit:"数据收集整理",lessons:[{title:"数据收集整理"}]},
 {unit:"表内除法（一）",lessons:[{title:"平均分"},{title:"除法"},{title:"用2-6的乘法口诀求商"}]},
 {unit:"图形的运动（一）",lessons:[{title:"轴对称图形"},{title:"平移和旋转"}]},
 {unit:"表内除法（二）",lessons:[{title:"用7、8、9的乘法口诀求商"},{title:"解决问题"}]},
 {unit:"混合运算",lessons:[{title:"同级运算"},{title:"两级运算"},{title:"含小括号的混合运算"},{title:"解决问题"}]},
 {unit:"有余数的除法",lessons:[{title:"有余数除法的认识"},{title:"余数和除数的关系"},{title:"有余数除法的竖式"},{title:"解决问题"}]},
 {unit:"万以内数的认识",lessons:[{title:"1000以内数的认识"},{title:"10000以内数的认识"},{title:"整百、整千数加减法"}]},
 {unit:"克和千克",lessons:[{title:"克和千克"}]},
 {unit:"数学广角——推理",lessons:[{title:"简单的推理"}]}],
"三上":[{unit:"时、分、秒",lessons:[{title:"秒的认识"},{title:"时间的计算"}]},
 {unit:"万以内的加法和减法（一）",lessons:[{title:"两位数加、减两位数"},{title:"几百几十加、减几百几十"},{title:"估算"}]},
 {unit:"测量",lessons:[{title:"毫米、分米的认识"},{title:"千米的认识"},{title:"吨的认识"}]},
 {unit:"万以内的加法和减法（二）",lessons:[{title:"加法",parts:["不进位加","进位加"]},{title:"减法",parts:["不退位减","退位减","解决问题"]}]},
 {unit:"倍的认识",lessons:[{title:"倍的认识"},{title:"求一个数是另一个数的几倍"},{title:"求一个数的几倍是多少"}]},
 {unit:"多位数乘一位数",lessons:[
   {title:"口算乘法",parts:["整十、整百数乘一位数","两位数乘一位数（不进位）"]},
   {title:"笔算乘法",parts:["不进位","一次进位","连续进位"]},
   {title:"有关0的乘法",parts:["因数中间有0","因数末尾有0"]},
   {title:"解决问题",parts:["估算","归一问题","归总问题"]}]},
 {unit:"长方形和正方形",lessons:[{title:"四边形"},{title:"周长"},{title:"长方形和正方形的周长"}]},
 {unit:"分数的初步认识",lessons:[{title:"几分之一"},{title:"几分之几"},{title:"分数的简单计算"},{title:"分数的简单应用"}]},
 {unit:"数学广角——集合",lessons:[{title:"集合（韦恩图）"}]}],
"三下":[{unit:"位置与方向（一）",lessons:[{title:"认识东、南、西、北"},{title:"认识东北、东南、西北、西南"}]},
 {unit:"除数是一位数的除法",lessons:[{title:"口算除法"},{title:"笔算除法",parts:["一位数除两位数","一位数除三位数","商中间有0","商末尾有0"]},{title:"解决问题（估算）"}]},
 {unit:"复式统计表",lessons:[{title:"复式统计表"}]},
 {unit:"两位数乘两位数",lessons:[{title:"口算乘法"},{title:"笔算乘法",parts:["不进位","进位"]},{title:"解决问题（连乘、连除）"}]},
 {unit:"面积",lessons:[{title:"面积和面积单位"},{title:"长方形、正方形面积的计算"},{title:"面积单位间的进率"}]},
 {unit:"年、月、日",lessons:[{title:"年、月、日"},{title:"24时计时法"}]},
 {unit:"小数的初步认识",lessons:[{title:"认识小数"},{title:"简单的小数加、减法"}]},
 {unit:"数学广角——搭配（二）",lessons:[{title:"稍复杂的排列与组合"}]}],
"四上":[{unit:"大数的认识",lessons:[{title:"亿以内数的认识",parts:["读法","写法","比较大小","改写与近似数"]},{title:"数的产生和十进制计数法"},{title:"亿以上数的认识"},{title:"计算工具的认识"}]},
 {unit:"公顷和平方千米",lessons:[{title:"公顷和平方千米"}]},
 {unit:"角的度量",lessons:[{title:"线段、直线、射线"},{title:"角的度量"},{title:"角的分类"},{title:"画角"}]},
 {unit:"三位数乘两位数",lessons:[{title:"笔算乘法"},{title:"因数中间或末尾有0的乘法"},{title:"积的变化规律"},{title:"单价、数量和总价"},{title:"速度、时间和路程"}]},
 {unit:"平行四边形和梯形",lessons:[{title:"平行与垂直"},{title:"画垂线"},{title:"平行四边形和梯形"}]},
 {unit:"除数是两位数的除法",lessons:[{title:"口算除法"},{title:"笔算除法",parts:["除数是整十数","四舍五入法试商","商是两位数"]},{title:"商的变化规律"}]},
 {unit:"条形统计图",lessons:[{title:"条形统计图"}]},
 {unit:"数学广角——优化",lessons:[{title:"沏茶问题"},{title:"烙饼问题"},{title:"田忌赛马"}]}],
"四下":[{unit:"四则运算",lessons:[{title:"加、减法的意义和各部分间的关系"},{title:"乘、除法的意义和各部分间的关系"},{title:"括号"},{title:"解决问题（租船）"}]},
 {unit:"观察物体（二）",lessons:[{title:"观察物体"}]},
 {unit:"运算定律",lessons:[{title:"加法运算定律"},{title:"乘法运算定律",parts:["乘法交换律和结合律","乘法分配律"]}]},
 {unit:"小数的意义和性质",lessons:[{title:"小数的意义和读写法"},{title:"小数的性质和大小比较"},{title:"小数点移动引起小数大小的变化"},{title:"小数的近似数"}]},
 {unit:"三角形",lessons:[{title:"三角形的特性"},{title:"三角形的分类"},{title:"三角形的内角和"}]},
 {unit:"小数的加法和减法",lessons:[{title:"小数加减法"},{title:"小数加减混合运算"},{title:"整数加法运算定律推广到小数"}]},
 {unit:"图形的运动（二）",lessons:[{title:"轴对称"},{title:"平移"}]},
 {unit:"平均数与条形统计图",lessons:[{title:"平均数"},{title:"复式条形统计图"}]},
 {unit:"数学广角——鸡兔同笼",lessons:[{title:"鸡兔同笼"}]}],
"五上":[{unit:"小数乘法",lessons:[{title:"小数乘整数"},{title:"小数乘小数"},{title:"积的近似数"},{title:"整数乘法运算定律推广到小数"},{title:"解决问题"}]},
 {unit:"位置",lessons:[{title:"用数对确定位置"}]},
 {unit:"小数除法",lessons:[{title:"除数是整数的小数除法"},{title:"一个数除以小数"},{title:"商的近似数"},{title:"循环小数"},{title:"用计算器探索规律"},{title:"解决问题（进一法、去尾法）"}]},
 {unit:"可能性",lessons:[{title:"可能性"}]},
 {unit:"简易方程",lessons:[{title:"用字母表示数"},{title:"方程的意义"},{title:"等式的性质"},{title:"解方程",parts:["x±a=b","ax=b","a-x=b","ax±b=c"]},{title:"实际问题与方程"}]},
 {unit:"多边形的面积",lessons:[{title:"平行四边形的面积"},{title:"三角形的面积"},{title:"梯形的面积"},{title:"组合图形的面积"}]},
 {unit:"数学广角——植树问题",lessons:[{title:"植树问题",parts:["两端都栽","两端都不栽","封闭图形"]}]}],
"五下":[{unit:"观察物体（三）",lessons:[{title:"观察物体"}]},
 {unit:"因数与倍数",lessons:[{title:"因数和倍数"},{title:"2、5、3的倍数的特征"},{title:"质数和合数"}]},
 {unit:"长方体和正方体",lessons:[{title:"长方体和正方体的认识"},{title:"长方体和正方体的表面积"},{title:"长方体和正方体的体积",parts:["体积和体积单位","体积公式","体积单位间的进率","容积和容积单位"]}]},
 {unit:"分数的意义和性质",lessons:[{title:"分数的意义"},{title:"真分数和假分数"},{title:"分数的基本性质"},{title:"约分"},{title:"通分"},{title:"分数和小数的互化"}]},
 {unit:"图形的运动（三）",lessons:[{title:"旋转"}]},
 {unit:"分数的加法和减法",lessons:[{title:"同分母分数加、减法"},{title:"异分母分数加、减法"},{title:"分数加减混合运算"}]},
 {unit:"折线统计图",lessons:[{title:"折线统计图"}]},
 {unit:"数学广角——找次品",lessons:[{title:"找次品"}]}],
"六上":[{unit:"分数乘法",lessons:[{title:"分数乘整数"},{title:"分数乘分数"},{title:"分数乘法的简便运算"},{title:"解决问题（连续求一个数的几分之几）"}]},
 {unit:"位置与方向（二）",lessons:[{title:"用方向和距离确定位置"}]},
 {unit:"分数除法",lessons:[{title:"倒数的认识"},{title:"分数除以整数"},{title:"一个数除以分数"},{title:"分数混合运算"},{title:"解决问题（已知一个数的几分之几求这个数）"}]},
 {unit:"比",lessons:[{title:"比的意义"},{title:"比的基本性质"},{title:"比的应用（按比分配）"}]},
 {unit:"圆",lessons:[{title:"圆的认识"},{title:"圆的周长"},{title:"圆的面积"},{title:"扇形"}]},
 {unit:"百分数（一）",lessons:[{title:"百分数的意义和读写"},{title:"百分数与小数、分数的互化"},{title:"用百分数解决问题"}]},
 {unit:"扇形统计图",lessons:[{title:"扇形统计图"}]},
 {unit:"数学广角——数与形",lessons:[{title:"数与形"}]}],
"六下":[{unit:"负数",lessons:[{title:"负数的认识"},{title:"在直线上表示数"}]},
 {unit:"百分数（二）",lessons:[{title:"折扣"},{title:"成数"},{title:"税率"},{title:"利率"}]},
 {unit:"圆柱与圆锥",lessons:[{title:"圆柱的认识"},{title:"圆柱的表面积"},{title:"圆柱的体积"},{title:"圆锥的认识"},{title:"圆锥的体积"}]},
 {unit:"比例",lessons:[{title:"比例的意义和基本性质"},{title:"解比例"},{title:"正比例"},{title:"反比例"},{title:"比例尺"},{title:"图形的放大与缩小"},{title:"用比例解决问题"}]},
 {unit:"数学广角——鸽巢问题",lessons:[{title:"鸽巢问题"}]},
 {unit:"整理和复习",lessons:[{title:"数与代数"},{title:"图形与几何"},{title:"统计与概率"},{title:"数学思考"},{title:"综合与实践"}]}
]}};

/* ———————— 小学语文（统编版） ———————— */
catalog["小学"]["语文"] = { "统编版（人教）":{
"一上":[{unit:"我上学了",lessons:[{title:"我是中国人"},{title:"我是小学生"},{title:"我爱学语文"}]},
 {unit:"识字（一）",lessons:[{title:"天地人"},{title:"金木水火土"},{title:"口耳目"},{title:"日月水火"},{title:"对韵歌"}]},
 {unit:"汉语拼音",lessons:[{title:"a o e"},{title:"i u ü y w"},{title:"b p m f"},{title:"d t n l"},{title:"g k h"},{title:"j q x"},{title:"z c s"},{title:"zh ch sh r"},{title:"ai ei ui"},{title:"ao ou iu"},{title:"ie üe er"},{title:"an en in un ün"},{title:"ang eng ing ong"}]},
 {unit:"课文（一）",lessons:[{title:"秋天"},{title:"小小的船"},{title:"江南"},{title:"四季"}]},
 {unit:"识字（二）",lessons:[{title:"画"},{title:"大小多少"},{title:"小书包"},{title:"日月明"},{title:"升国旗"}]},
 {unit:"课文（二）",lessons:[{title:"影子"},{title:"比尾巴"},{title:"青蛙写诗"},{title:"雨点儿"}]},
 {unit:"课文（三）",lessons:[{title:"明天要远足"},{title:"大还是小"},{title:"项链"}]},
 {unit:"课文（四）",lessons:[{title:"雪地里的小画家"},{title:"乌鸦喝水"},{title:"小蜗牛"}]}],
"二上":[{unit:"课文（一）",lessons:[{title:"小蝌蚪找妈妈"},{title:"我是什么"},{title:"植物妈妈有办法"}]},
 {unit:"识字",lessons:[{title:"场景歌"},{title:"树之歌"},{title:"拍手歌"},{title:"田家四季歌"}]},
 {unit:"课文（二）",lessons:[{title:"黄山奇石"},{title:"日月潭"},{title:"葡萄沟"}]},
 {unit:"课文（三）",lessons:[{title:"坐井观天"},{title:"寒号鸟"},{title:"我要的是葫芦"}]},
 {unit:"课文（四）",lessons:[{title:"大禹治水"},{title:"朱德的扁担"},{title:"难忘的泼水节"}]},
 {unit:"课文（五）",lessons:[{title:"雪孩子"},{title:"狐假虎威"},{title:"狐狸分奶酪"}]},
 {unit:"课文（六）",lessons:[{title:"纸船和风筝"},{title:"风娃娃"}]}],
"三上":[{unit:"第一单元",lessons:[{title:"大青树下的小学"},{title:"花的学校"},{title:"不懂就要问"}]},
 {unit:"第二单元",lessons:[{title:"古诗三首（山行/赠刘景文/夜书所见）",parts:["山行","赠刘景文","夜书所见"]},{title:"铺满金色巴掌的水泥道"},{title:"秋天的雨"},{title:"听听，秋的声音"}]},
 {unit:"第三单元",lessons:[{title:"卖火柴的小女孩"},{title:"那一定会很好"},{title:"在牛肚子里旅行"},{title:"一块奶酪"}]},
 {unit:"第四单元",lessons:[{title:"总也倒不了的老屋"},{title:"胡萝卜先生的长胡子"},{title:"小狗学叫"}]},
 {unit:"第五单元",lessons:[{title:"搭船的鸟"},{title:"金色的草地"}]},
 {unit:"第六单元",lessons:[{title:"古诗三首（望天门山/饮湖上初晴后雨/望洞庭）",parts:["望天门山","饮湖上初晴后雨","望洞庭"]},{title:"富饶的西沙群岛"},{title:"海滨小城"},{title:"美丽的小兴安岭"}]},
 {unit:"第七单元",lessons:[{title:"大自然的声音"},{title:"父亲、树林和鸟"},{title:"读不完的大书"}]},
 {unit:"第八单元",lessons:[{title:"司马光"},{title:"掌声"},{title:"灰雀"},{title:"手术台就是阵地"}]}],
"四上":[{unit:"第一单元",lessons:[{title:"观潮"},{title:"走月亮"},{title:"现代诗二首（秋晚的江上/花牛歌）"},{title:"繁星"}]},
 {unit:"第二单元",lessons:[{title:"一个豆荚里的五粒豆"},{title:"蝙蝠和雷达"},{title:"呼风唤雨的世纪"},{title:"蝴蝶的家"}]},
 {unit:"第三单元",lessons:[{title:"古诗三首（暮江吟/题西林壁/雪梅）",parts:["暮江吟","题西林壁","雪梅"]},{title:"爬山虎的脚"},{title:"蟋蟀的住宅"}]},
 {unit:"第四单元",lessons:[{title:"盘古开天地"},{title:"精卫填海"},{title:"普罗米修斯"},{title:"女娲补天"}]},
 {unit:"第五单元",lessons:[{title:"麻雀"},{title:"爬天都峰"}]},
 {unit:"第六单元",lessons:[{title:"牛和鹅"},{title:"一只窝囊的大老虎"},{title:"陀螺"}]},
 {unit:"第七单元",lessons:[{title:"古诗三首（出塞/凉州词/夏日绝句）",parts:["出塞","凉州词","夏日绝句"]},{title:"为中华之崛起而读书"},{title:"梅兰芳蓄须"},{title:"延安，我把你追寻"}]},
 {unit:"第八单元",lessons:[{title:"西门豹治邺"},{title:"故事二则（扁鹊治病/纪昌学射）",parts:["扁鹊治病","纪昌学射"]}]}],
"五上":[{unit:"第一单元",lessons:[{title:"白鹭"},{title:"落花生"},{title:"桂花雨"},{title:"珍珠鸟"}]},
 {unit:"第二单元",lessons:[{title:"搭石"},{title:"将相和"},{title:"什么比猎豹的速度更快"},{title:"冀中的地道战"}]},
 {unit:"第三单元",lessons:[{title:"猎人海力布"},{title:"牛郎织女（一）"},{title:"牛郎织女（二）"}]},
 {unit:"第四单元",lessons:[{title:"古诗三首（示儿/题临安邸/己亥杂诗）",parts:["示儿","题临安邸","己亥杂诗"]},{title:"少年中国说（节选）"},{title:"圆明园的毁灭"},{title:"小岛"}]},
 {unit:"第五单元",lessons:[{title:"太阳"},{title:"松鼠"}]},
 {unit:"第六单元",lessons:[{title:"慈母情深"},{title:"父爱之舟"},{title:"“精彩极了”和“糟糕透了”"}]},
 {unit:"第七单元",lessons:[{title:"古诗词三首（山居秋暝/枫桥夜泊/长相思）",parts:["山居秋暝","枫桥夜泊","长相思"]},{title:"四季之美"},{title:"鸟的天堂"},{title:"月迹"}]},
 {unit:"第八单元",lessons:[{title:"古人谈读书",parts:["论语选句","朱熹谈读书"]},{title:"忆读书"},{title:"我的“长生果”"}]}],
"六上":[{unit:"第一单元",lessons:[{title:"草原"},{title:"丁香结"},{title:"古诗词三首（宿建德江/六月二十七日望湖楼醉书/西江月·夜行黄沙道中）"},{title:"花之歌"}]},
 {unit:"第二单元",lessons:[{title:"七律·长征"},{title:"狼牙山五壮士"},{title:"开国大典"},{title:"灯光"},{title:"我的战友邱少云"}]},
 {unit:"第三单元",lessons:[{title:"竹节人"},{title:"宇宙生命之谜"},{title:"故宫博物院"}]},
 {unit:"第四单元",lessons:[{title:"桥"},{title:"穷人"},{title:"金色的鱼钩"}]},
 {unit:"第五单元",lessons:[{title:"夏天里的成长"},{title:"盼"}]},
 {unit:"第六单元",lessons:[{title:"古诗三首（浪淘沙/江南春/书湖阴先生壁）"},{title:"只有一个地球"},{title:"青山不老"},{title:"三黑和土地"}]},
 {unit:"第七单元",lessons:[{title:"文言文二则（伯牙鼓琴/书戴嵩画牛）",parts:["伯牙鼓琴","书戴嵩画牛"]},{title:"月光曲"},{title:"京剧趣谈"}]},
 {unit:"第八单元",lessons:[{title:"少年闰土"},{title:"好的故事"},{title:"我的伯父鲁迅先生"},{title:"有的人——纪念鲁迅有感"}]}]
}};

/* ———————— 小学英语（人教PEP版） ———————— */
catalog["小学"]["英语"] = { "人教PEP版":{
"三上":[{unit:"Unit 1",lessons:[{title:"Hello!",parts:["Part A Let's talk/Let's learn","Part B Let's talk/Let's learn","Part C Story time"]}]},{unit:"Unit 2",lessons:[{title:"Colours"}]},{unit:"Unit 3",lessons:[{title:"Look at me!"}]},{unit:"Unit 4",lessons:[{title:"We love animals"}]},{unit:"Unit 5",lessons:[{title:"Let's eat!"}]},{unit:"Unit 6",lessons:[{title:"Happy birthday!"}]}],
"三下":[{unit:"Unit 1",lessons:[{title:"Welcome back to school!"}]},{unit:"Unit 2",lessons:[{title:"My family"}]},{unit:"Unit 3",lessons:[{title:"At the zoo"}]},{unit:"Unit 4",lessons:[{title:"Where is my car?"}]},{unit:"Unit 5",lessons:[{title:"Do you like pears?"}]},{unit:"Unit 6",lessons:[{title:"How many?"}]}],
"四上":[{unit:"Unit 1",lessons:[{title:"My classroom"}]},{unit:"Unit 2",lessons:[{title:"My schoolbag"}]},{unit:"Unit 3",lessons:[{title:"My friends"}]},{unit:"Unit 4",lessons:[{title:"My home"}]},{unit:"Unit 5",lessons:[{title:"Dinner's ready"}]},{unit:"Unit 6",lessons:[{title:"Meet my family!"}]}],
"四下":[{unit:"Unit 1",lessons:[{title:"My school"}]},{unit:"Unit 2",lessons:[{title:"What time is it?"}]},{unit:"Unit 3",lessons:[{title:"Weather"}]},{unit:"Unit 4",lessons:[{title:"At the farm"}]},{unit:"Unit 5",lessons:[{title:"My clothes"}]},{unit:"Unit 6",lessons:[{title:"Shopping"}]}],
"五上":[{unit:"Unit 1",lessons:[{title:"What's he like?"}]},{unit:"Unit 2",lessons:[{title:"My week"}]},{unit:"Unit 3",lessons:[{title:"What would you like?"}]},{unit:"Unit 4",lessons:[{title:"What can you do?"}]},{unit:"Unit 5",lessons:[{title:"There is a big bed"}]},{unit:"Unit 6",lessons:[{title:"In a nature park"}]}],
"五下":[{unit:"Unit 1",lessons:[{title:"My day"}]},{unit:"Unit 2",lessons:[{title:"My favourite season"}]},{unit:"Unit 3",lessons:[{title:"My school calendar"}]},{unit:"Unit 4",lessons:[{title:"When is the art show?"}]},{unit:"Unit 5",lessons:[{title:"Whose dog is it?"}]},{unit:"Unit 6",lessons:[{title:"Work quietly!"}]}],
"六上":[{unit:"Unit 1",lessons:[{title:"How can I get there?"}]},{unit:"Unit 2",lessons:[{title:"Ways to go to school"}]},{unit:"Unit 3",lessons:[{title:"My weekend plan"}]},{unit:"Unit 4",lessons:[{title:"I have a pen pal"}]},{unit:"Unit 5",lessons:[{title:"What does he do?"}]},{unit:"Unit 6",lessons:[{title:"How do you feel?"}]}],
"六下":[{unit:"Unit 1",lessons:[{title:"How tall are you?"}]},{unit:"Unit 2",lessons:[{title:"Last weekend"}]},{unit:"Unit 3",lessons:[{title:"Where did you go?"}]},{unit:"Unit 4",lessons:[{title:"Then and now"}]},{unit:"Recycle",lessons:[{title:"Mike's happy days"}]}]
}};

/* ———————— 小学道德与法治（统编版） ———————— */
catalog["小学"]["道德与法治"] = { "统编版（人教）":{
"三上":[{unit:"第一单元",lessons:[{title:"学习伴我成长"},{title:"我学习，我快乐"},{title:"做学习的主人"}]},{unit:"第二单元",lessons:[{title:"说说我们的学校"},{title:"走近我们的老师"},{title:"让我们的学校更美好"}]},{unit:"第三单元",lessons:[{title:"生命最宝贵"},{title:"安全记心上"},{title:"心中的“110”"}]},{unit:"第四单元",lessons:[{title:"父母多爱我"},{title:"爸爸妈妈在我心中"},{title:"家庭的记忆"}]}],
"四上":[{unit:"第一单元",lessons:[{title:"我们班四岁了"},{title:"我们的班规我们订"},{title:"我们班 他们班"}]},{unit:"第二单元",lessons:[{title:"少让父母为我操心"},{title:"这些事我来做"},{title:"我的家庭贡献与责任"}]},{unit:"第三单元",lessons:[{title:"健康看电视"},{title:"网络新世界"},{title:"正确认识广告"}]},{unit:"第四单元",lessons:[{title:"我们所了解的环境污染"},{title:"变废为宝有妙招"},{title:"低碳生活每一天"}]}],
"五上":[{unit:"第一单元",lessons:[{title:"自主选择课余生活"},{title:"学会沟通交流"},{title:"主动拒绝烟酒与毒品"}]},{unit:"第二单元",lessons:[{title:"选举产生班委会"},{title:"协商决定班级事务"}]},{unit:"第三单元",lessons:[{title:"我们神圣的国土"},{title:"中华民族一家亲"}]},{unit:"第四单元",lessons:[{title:"美丽文字 民族瑰宝"},{title:"古代科技 耀我中华"},{title:"传统美德 源远流长"}]}],
"六上":[{unit:"第一单元",lessons:[{title:"感受生活中的法律"},{title:"宪法是根本法"}]},{unit:"第二单元",lessons:[{title:"公民意味着什么"},{title:"公民的基本权利和义务"}]},{unit:"第三单元",lessons:[{title:"国家机构有哪些"},{title:"人大代表为人民"},{title:"权力受到制约和监督"}]},{unit:"第四单元",lessons:[{title:"我们受特殊保护"},{title:"知法守法 依法维权"}]}]
}};

/* ———————— 小学科学（教科版） ———————— */
catalog["小学"]["科学"] = { "教科版":{
"三上":[{unit:"水",lessons:[{title:"水到哪里去了"},{title:"水沸腾了"},{title:"水结冰了"},{title:"冰融化了"}]},{unit:"空气",lessons:[{title:"感受空气"},{title:"空气能占据空间吗"},{title:"压缩空气"}]},{unit:"天气",lessons:[{title:"我们关心天气"},{title:"认识气温计"},{title:"测量气温"},{title:"观测风"}]}],
"四上":[{unit:"声音",lessons:[{title:"听听声音"},{title:"声音是怎样产生的"},{title:"声音是怎样传播的"}]},{unit:"呼吸与消化",lessons:[{title:"感受我们的呼吸"},{title:"食物在身体里的旅行"}]},{unit:"运动和力",lessons:[{title:"让小车运动起来"},{title:"用气球驱动小车"},{title:"弹簧测力计"}]}],
"五上":[{unit:"光",lessons:[{title:"有关光的思考"},{title:"光是怎样传播的"},{title:"光的反射现象"},{title:"光的折射现象"}]},{unit:"地球表面的变化",lessons:[{title:"地球的表面"},{title:"地震的成因及作用"},{title:"火山喷发的成因及作用"}]},{unit:"计量时间",lessons:[{title:"时间在流逝"},{title:"用水计量时间"},{title:"我们的水钟"}]}],
"六上":[{unit:"微小世界",lessons:[{title:"放大镜"},{title:"怎样放得更大"},{title:"观察洋葱表皮细胞"}]},{unit:"地球的运动",lessons:[{title:"我们的地球模型"},{title:"昼夜交替现象"},{title:"人类认识地球运动的历史"}]},{unit:"工具与技术",lessons:[{title:"紧密联系的工具和技术"},{title:"斜面"},{title:"不简单的杠杆"}]}]
}};

/* ———————— 初中语文（统编版） ———————— */
catalog["初中"]["语文"] = { "统编版（人教）":{
"七上":[{unit:"第一单元",lessons:[{title:"春"},{title:"济南的冬天"},{title:"雨的四季"},{title:"古代诗歌四首（观沧海/闻王昌龄左迁龙标遥有此寄/次北固山下/天净沙·秋思）"}]},
 {unit:"第二单元",lessons:[{title:"秋天的怀念"},{title:"散步"},{title:"散文诗二首（金色花/荷叶·母亲）"},{title:"《世说新语》二则（咏雪/陈太丘与友期行）"}]},
 {unit:"第三单元",lessons:[{title:"从百草园到三味书屋"},{title:"再塑生命的人"},{title:"《论语》十二章"}]},
 {unit:"第四单元",lessons:[{title:"纪念白求恩"},{title:"植树的牧羊人"},{title:"走一步，再走一步"},{title:"诫子书"}]},
 {unit:"第五单元",lessons:[{title:"猫"},{title:"动物笑谈"},{title:"狼"}]},
 {unit:"第六单元",lessons:[{title:"皇帝的新装"},{title:"天上的街市"},{title:"女娲造人"},{title:"寓言四则（赫耳墨斯和雕像者/蚊子和狮子/穿井得一人/杞人忧天）"}]}],
"七下":[{unit:"第一单元",lessons:[{title:"邓稼先"},{title:"说和做——记闻一多先生言行片段"},{title:"回忆鲁迅先生（节选）"},{title:"孙权劝学"}]},
 {unit:"第二单元",lessons:[{title:"黄河颂"},{title:"老山界"},{title:"谁是最可爱的人"},{title:"土地的誓言"},{title:"木兰诗"}]},
 {unit:"第三单元",lessons:[{title:"阿长与《山海经》"},{title:"老王"},{title:"台阶"},{title:"卖油翁"}]},
 {unit:"第四单元",lessons:[{title:"叶圣陶先生二三事"},{title:"驿路梨花"},{title:"最苦与最乐"},{title:"短文两篇（陋室铭/爱莲说）",parts:["陋室铭","爱莲说"]}]},
 {unit:"第五单元",lessons:[{title:"紫藤萝瀑布"},{title:"一棵小桃树"},{title:"外国诗二首（假如生活欺骗了你/未选择的路）"},{title:"古代诗歌五首"}]},
 {unit:"第六单元",lessons:[{title:"伟大的悲剧"},{title:"太空一日"},{title:"带上她的眼睛"},{title:"河中石兽"}]}],
"八上":[{unit:"第一单元",lessons:[{title:"消息二则（我三十万大军胜利南渡长江/人民解放军百万大军横渡长江）"},{title:"首届诺贝尔奖颁发"},{title:"“飞天”凌空"},{title:"一着惊海天"}]},
 {unit:"第二单元",lessons:[{title:"藤野先生"},{title:"回忆我的母亲"},{title:"列夫·托尔斯泰"},{title:"美丽的颜色"}]},
 {unit:"第三单元",lessons:[{title:"三峡"},{title:"短文二篇（答谢中书书/记承天寺夜游）",parts:["答谢中书书","记承天寺夜游"]},{title:"与朱元思书"},{title:"唐诗五首（野望/黄鹤楼/使至塞上/渡荆门送别/钱塘湖春行）"}]},
 {unit:"第四单元",lessons:[{title:"背影"},{title:"白杨礼赞"},{title:"散文二篇（永久的生命/我为什么而活着）",parts:["永久的生命","我为什么而活着"]},{title:"昆明的雨"}]},
 {unit:"第五单元",lessons:[{title:"中国石拱桥"},{title:"苏州园林"},{title:"蝉"},{title:"梦回繁华"}]},
 {unit:"第六单元",lessons:[{title:"《孟子》三章（得道多助，失道寡助/富贵不能淫/生于忧患，死于安乐）"},{title:"愚公移山"},{title:"周亚夫军细柳"},{title:"诗词五首（饮酒/春望/雁门太守行/赤壁/渔家傲）"}]}],
"八下":[{unit:"第一单元",lessons:[{title:"社戏"},{title:"回延安"},{title:"安塞腰鼓"},{title:"灯笼"}]},
 {unit:"第二单元",lessons:[{title:"大自然的语言"},{title:"恐龙无处不有"},{title:"被压扁的沙子"},{title:"大雁归来"},{title:"时间的脚印"}]},
 {unit:"第三单元",lessons:[{title:"桃花源记"},{title:"小石潭记"},{title:"核舟记"},{title:"《诗经》二首（关雎/蒹葭）"}]},
 {unit:"第四单元",lessons:[{title:"最后一次讲演"},{title:"应有格物致知精神"},{title:"我一生中的重要抉择"},{title:"庆祝奥林匹克运动复兴25周年"}]},
 {unit:"第五单元",lessons:[{title:"壶口瀑布"},{title:"在长江源头各拉丹冬"},{title:"登勃朗峰"},{title:"一滴水经过丽江"}]},
 {unit:"第六单元",lessons:[{title:"《庄子》二则（北冥有鱼/庄子与惠子游于濠梁之上）"},{title:"《礼记》二则（虽有嘉肴/大道之行也）"},{title:"马说"},{title:"唐诗二首（茅屋为秋风所破歌/卖炭翁）"}]}],
"九上":[{unit:"第一单元",lessons:[{title:"沁园春·雪"},{title:"我爱这土地"},{title:"乡愁"},{title:"你是人间的四月天"}]},
 {unit:"第二单元",lessons:[{title:"敬业与乐业"},{title:"就英法联军远征中国致巴特勒上尉的信"},{title:"论教养"},{title:"精神的三间小屋"}]},
 {unit:"第三单元",lessons:[{title:"岳阳楼记"},{title:"醉翁亭记"},{title:"湖心亭看雪"},{title:"诗词三首（行路难/酬乐天扬州初逢席上见赠/水调歌头）"}]},
 {unit:"第四单元",lessons:[{title:"故乡"},{title:"我的叔叔于勒"},{title:"孤独之旅"}]},
 {unit:"第五单元",lessons:[{title:"中国人失掉自信力了吗"},{title:"怀疑与学问"},{title:"谈创造性思维"},{title:"创造宣言"}]},
 {unit:"第六单元",lessons:[{title:"智取生辰纲"},{title:"范进中举"},{title:"三顾茅庐"},{title:"刘姥姥进大观园"}]}],
"九下":[{unit:"第一单元",lessons:[{title:"祖国啊，我亲爱的祖国"},{title:"梅岭三章"},{title:"短诗五首"},{title:"海燕"}]},
 {unit:"第二单元",lessons:[{title:"孔乙己"},{title:"变色龙"},{title:"溜索"},{title:"蒲柳人家（节选）"}]},
 {unit:"第三单元",lessons:[{title:"鱼我所欲也"},{title:"唐雎不辱使命"},{title:"送东阳马生序"},{title:"词四首（渔家傲·秋思/江城子·密州出猎/破阵子/满江红）"}]},
 {unit:"第四单元",lessons:[{title:"短文两篇（谈读书/不求甚解）"},{title:"山水画的意境"},{title:"无言之美"},{title:"驱遣我们的想象"}]},
 {unit:"第五单元",lessons:[{title:"屈原（节选）"},{title:"天下第一楼（节选）"},{title:"枣儿"}]},
 {unit:"第六单元",lessons:[{title:"曹刿论战"},{title:"邹忌讽齐王纳谏"},{title:"陈涉世家"},{title:"出师表"},{title:"诗词曲五首"}]}]
}};

/* ———————— 初中数学（人教版） ———————— */
catalog["初中"]["数学"] = { "人教版":{
"七上":[{unit:"第一章 有理数",lessons:[{title:"正数和负数"},{title:"有理数",parts:["有理数","数轴","相反数","绝对值"]},{title:"有理数的加减法",parts:["加法","减法"]},{title:"有理数的乘除法",parts:["乘法","除法"]},{title:"有理数的乘方",parts:["乘方","科学记数法","近似数"]}]},
 {unit:"第二章 整式的加减",lessons:[{title:"整式",parts:["单项式","多项式"]},{title:"整式的加减"}]},
 {unit:"第三章 一元一次方程",lessons:[{title:"从算式到方程"},{title:"解一元一次方程（一）——合并同类项与移项"},{title:"解一元一次方程（二）——去括号与去分母"},{title:"实际问题与一元一次方程"}]},
 {unit:"第四章 几何图形初步",lessons:[{title:"几何图形"},{title:"直线、射线、线段"},{title:"角",parts:["角的认识","角的比较与运算","余角和补角"]},{title:"课题学习 设计制作长方体形状的包装纸盒"}]}],
"七下":[{unit:"第五章 相交线与平行线",lessons:[{title:"相交线",parts:["相交线","垂线","同位角、内错角、同旁内角"]},{title:"平行线及其判定"},{title:"平行线的性质"},{title:"平移"}]},
 {unit:"第六章 实数",lessons:[{title:"平方根"},{title:"立方根"},{title:"实数"}]},
 {unit:"第七章 平面直角坐标系",lessons:[{title:"平面直角坐标系"},{title:"坐标方法的简单应用"}]},
 {unit:"第八章 二元一次方程组",lessons:[{title:"二元一次方程组"},{title:"消元——解二元一次方程组",parts:["代入消元法","加减消元法"]},{title:"实际问题与二元一次方程组"}]},
 {unit:"第九章 不等式与不等式组",lessons:[{title:"不等式"},{title:"一元一次不等式"},{title:"一元一次不等式组"}]},
 {unit:"第十章 数据的收集、整理与描述",lessons:[{title:"统计调查"},{title:"直方图"}]}],
"八上":[{unit:"第十一章 三角形",lessons:[{title:"与三角形有关的线段"},{title:"与三角形有关的角"},{title:"多边形及其内角和"}]},
 {unit:"第十二章 全等三角形",lessons:[{title:"全等三角形"},{title:"三角形全等的判定",parts:["SSS","SAS","ASA、AAS","HL"]},{title:"角的平分线的性质"}]},
 {unit:"第十三章 轴对称",lessons:[{title:"轴对称"},{title:"画轴对称图形"},{title:"等腰三角形"},{title:"课题学习 最短路径问题"}]},
 {unit:"第十四章 整式的乘法与因式分解",lessons:[{title:"整式的乘法",parts:["幂的运算","整式的乘法"]},{title:"乘法公式",parts:["平方差公式","完全平方公式"]},{title:"因式分解",parts:["提公因式法","公式法"]}]},
 {unit:"第十五章 分式",lessons:[{title:"分式"},{title:"分式的运算"},{title:"分式方程"}]}],
"八下":[{unit:"第十六章 二次根式",lessons:[{title:"二次根式"},{title:"二次根式的乘除"},{title:"二次根式的加减"}]},
 {unit:"第十七章 勾股定理",lessons:[{title:"勾股定理"},{title:"勾股定理的逆定理"}]},
 {unit:"第十八章 平行四边形",lessons:[{title:"平行四边形"},{title:"特殊的平行四边形",parts:["矩形","菱形","正方形"]}]},
 {unit:"第十九章 一次函数",lessons:[{title:"函数"},{title:"一次函数"},{title:"课题学习 选择方案"}]},
 {unit:"第二十章 数据的分析",lessons:[{title:"数据的集中趋势",parts:["平均数","中位数和众数"]},{title:"数据的波动程度"}]}],
"九上":[{unit:"第二十一章 一元二次方程",lessons:[{title:"一元二次方程"},{title:"解一元二次方程",parts:["配方法","公式法","因式分解法"]},{title:"实际问题与一元二次方程"}]},
 {unit:"第二十二章 二次函数",lessons:[{title:"二次函数的图象和性质",parts:["y=ax²","y=a(x-h)²+k","y=ax²+bx+c"]},{title:"二次函数与一元二次方程"},{title:"实际问题与二次函数"}]},
 {unit:"第二十三章 旋转",lessons:[{title:"图形的旋转"},{title:"中心对称"}]},
 {unit:"第二十四章 圆",lessons:[{title:"圆的有关性质"},{title:"点和圆、直线和圆的位置关系"},{title:"正多边形和圆"},{title:"弧长和扇形面积"}]},
 {unit:"第二十五章 概率初步",lessons:[{title:"随机事件与概率"},{title:"用列举法求概率"},{title:"用频率估计概率"}]}],
"九下":[{unit:"第二十六章 反比例函数",lessons:[{title:"反比例函数"},{title:"实际问题与反比例函数"}]},
 {unit:"第二十七章 相似",lessons:[{title:"图形的相似"},{title:"相似三角形"},{title:"位似"}]},
 {unit:"第二十八章 锐角三角函数",lessons:[{title:"锐角三角函数"},{title:"解直角三角形及其应用"}]},
 {unit:"第二十九章 投影与视图",lessons:[{title:"投影"},{title:"三视图"}]}]
}};

/* ———————— 初中英语（人教版 Go for it） ———————— */
catalog["初中"]["英语"] = { "人教版":{
"七上":[{unit:"Starter",lessons:[{title:"Starter Unit 1 Good morning!"},{title:"Starter Unit 2 What's this in English?"},{title:"Starter Unit 3 What color is it?"}]},
 {unit:"Units 1-9",lessons:[{title:"Unit 1 My name's Gina."},{title:"Unit 2 This is my sister."},{title:"Unit 3 Is this your pencil?"},{title:"Unit 4 Where's my schoolbag?"},{title:"Unit 5 Do you have a soccer ball?"},{title:"Unit 6 Do you like bananas?"},{title:"Unit 7 How much are these socks?"},{title:"Unit 8 When is your birthday?"},{title:"Unit 9 My favorite subject is science."}]}],
"七下":[{unit:"Units 1-12",lessons:[{title:"Unit 1 Can you play the guitar?"},{title:"Unit 2 What time do you go to school?"},{title:"Unit 3 How do you get to school?"},{title:"Unit 4 Don't eat in class."},{title:"Unit 5 Why do you like pandas?"},{title:"Unit 6 I'm watching TV."},{title:"Unit 7 It's raining!"},{title:"Unit 8 Is there a post office near here?"},{title:"Unit 9 What does he look like?"},{title:"Unit 10 I'd like some noodles."},{title:"Unit 11 How was your school trip?"},{title:"Unit 12 What did you do last weekend?"}]}],
"八上":[{unit:"Units 1-10",lessons:[{title:"Unit 1 Where did you go on vacation?"},{title:"Unit 2 How often do you exercise?"},{title:"Unit 3 I'm more outgoing than my sister."},{title:"Unit 4 What's the best movie theater?"},{title:"Unit 5 Do you want to watch a game show?"},{title:"Unit 6 I'm going to study computer science."},{title:"Unit 7 Will people have robots?"},{title:"Unit 8 How do you make a banana milk shake?"},{title:"Unit 9 Can you come to my party?"},{title:"Unit 10 If you go to the party, you'll have a great time!"}]}],
"八下":[{unit:"Units 1-10",lessons:[{title:"Unit 1 What's the matter?"},{title:"Unit 2 I'll help to clean up the city parks."},{title:"Unit 3 Could you please clean your room?"},{title:"Unit 4 Why don't you talk to your parents?"},{title:"Unit 5 What were you doing when the rainstorm came?"},{title:"Unit 6 An old man tried to move the mountains."},{title:"Unit 7 Have you read Treasure Island yet?"},{title:"Unit 8 What's the highest mountain in the world?"},{title:"Unit 9 Have you ever been to a museum?"},{title:"Unit 10 I've had this bike for three years."}]}],
"九全":[{unit:"Units 1-14",lessons:[{title:"Unit 1 How can we become good learners?"},{title:"Unit 2 I think that mooncakes are delicious!"},{title:"Unit 3 Could you please tell me where the restrooms are?"},{title:"Unit 4 I used to be afraid of the dark."},{title:"Unit 5 What are the shirts made of?"},{title:"Unit 6 When was it invented?"},{title:"Unit 7 Teenagers should be allowed to choose their own clothes."},{title:"Unit 8 It must belong to Carla."},{title:"Unit 9 I like music that I can dance to."},{title:"Unit 10 You're supposed to shake hands."},{title:"Unit 11 Sad movies make me cry."},{title:"Unit 12 Life is full of the unexpected."},{title:"Unit 13 We're trying to save the earth!"},{title:"Unit 14 I remember meeting all of you in Grade 7."}]}]
}};

/* ———————— 初中物理（人教版） ———————— */
catalog["初中"]["物理"] = { "人教版":{
"八上":[{unit:"第一章 机械运动",lessons:[{title:"长度和时间的测量"},{title:"运动的描述"},{title:"运动的快慢"},{title:"测量平均速度"}]},
 {unit:"第二章 声现象",lessons:[{title:"声音的产生与传播"},{title:"声音的特性"},{title:"声的利用"},{title:"噪声的危害和控制"}]},
 {unit:"第三章 物态变化",lessons:[{title:"温度"},{title:"熔化和凝固"},{title:"汽化和液化"},{title:"升华和凝华"}]},
 {unit:"第四章 光现象",lessons:[{title:"光的直线传播"},{title:"光的反射"},{title:"平面镜成像"},{title:"光的折射"},{title:"光的色散"}]},
 {unit:"第五章 透镜及其应用",lessons:[{title:"透镜"},{title:"生活中的透镜"},{title:"凸透镜成像的规律"},{title:"眼睛和眼镜"},{title:"显微镜和望远镜"}]},
 {unit:"第六章 质量与密度",lessons:[{title:"质量"},{title:"密度"},{title:"测量物质的密度"},{title:"密度与社会生活"}]}],
"八下":[{unit:"第七章 力",lessons:[{title:"力"},{title:"弹力"},{title:"重力"}]},
 {unit:"第八章 运动和力",lessons:[{title:"牛顿第一定律"},{title:"二力平衡"},{title:"摩擦力"}]},
 {unit:"第九章 压强",lessons:[{title:"压强"},{title:"液体的压强"},{title:"大气压强"},{title:"流体压强与流速的关系"}]},
 {unit:"第十章 浮力",lessons:[{title:"浮力"},{title:"阿基米德原理"},{title:"物体的浮沉条件及应用"}]},
 {unit:"第十一章 功和机械能",lessons:[{title:"功"},{title:"功率"},{title:"动能和势能"},{title:"机械能及其转化"}]},
 {unit:"第十二章 简单机械",lessons:[{title:"杠杆"},{title:"滑轮"},{title:"机械效率"}]}],
"九全":[{unit:"第十三章 内能",lessons:[{title:"分子热运动"},{title:"内能"},{title:"比热容"}]},
 {unit:"第十四章 内能的利用",lessons:[{title:"热机"},{title:"热机的效率"},{title:"能量的转化和守恒"}]},
 {unit:"第十五章 电流和电路",lessons:[{title:"两种电荷"},{title:"电流和电路"},{title:"串联和并联"},{title:"电流的测量"},{title:"串、并联电路中电流的规律"}]},
 {unit:"第十六章 电压 电阻",lessons:[{title:"电压"},{title:"串、并联电路中电压的规律"},{title:"电阻"},{title:"变阻器"}]},
 {unit:"第十七章 欧姆定律",lessons:[{title:"电流与电压和电阻的关系"},{title:"欧姆定律"},{title:"电阻的测量"},{title:"欧姆定律在串、并联电路中的应用"}]},
 {unit:"第十八章 电功率",lessons:[{title:"电能 电功"},{title:"电功率"},{title:"测量小灯泡的电功率"},{title:"焦耳定律"}]},
 {unit:"第十九章 生活用电",lessons:[{title:"家庭电路"},{title:"家庭电路中电流过大的原因"},{title:"安全用电"}]},
 {unit:"第二十章 电与磁",lessons:[{title:"磁现象 磁场"},{title:"电生磁"},{title:"电磁铁 电磁继电器"},{title:"电动机"},{title:"磁生电"}]},
 {unit:"第二十一章 信息的传递",lessons:[{title:"现代顺风耳——电话"},{title:"电磁波的海洋"},{title:"越来越宽的信息之路"}]},
 {unit:"第二十二章 能源与可持续发展",lessons:[{title:"能源"},{title:"核能"},{title:"太阳能"},{title:"能源与可持续发展"}]}]
}};

/* ———————— 初中化学（人教版） ———————— */
catalog["初中"]["化学"] = { "人教版":{
"九上":[{unit:"绪言",lessons:[{title:"化学使世界变得更加绚丽多彩"}]},
 {unit:"第一单元 走进化学世界",lessons:[{title:"物质的变化和性质"},{title:"化学是一门以实验为基础的科学"},{title:"走进化学实验室"}]},
 {unit:"第二单元 我们周围的空气",lessons:[{title:"空气"},{title:"氧气"},{title:"制取氧气"}]},
 {unit:"第三单元 物质构成的奥秘",lessons:[{title:"分子和原子"},{title:"原子的结构"},{title:"元素"}]},
 {unit:"第四单元 自然界的水",lessons:[{title:"爱护水资源"},{title:"水的净化"},{title:"水的组成"},{title:"化学式与化合价"}]},
 {unit:"第五单元 化学方程式",lessons:[{title:"质量守恒定律"},{title:"如何正确书写化学方程式"},{title:"利用化学方程式的简单计算"}]},
 {unit:"第六单元 碳和碳的氧化物",lessons:[{title:"金刚石、石墨和C60"},{title:"二氧化碳制取的研究"},{title:"二氧化碳和一氧化碳"}]},
 {unit:"第七单元 燃料及其利用",lessons:[{title:"燃烧和灭火"},{title:"燃料的合理利用与开发"}]}],
"九下":[{unit:"第八单元 金属和金属材料",lessons:[{title:"金属材料"},{title:"金属的化学性质"},{title:"金属资源的利用和保护"}]},
 {unit:"第九单元 溶液",lessons:[{title:"溶液的形成"},{title:"溶解度"},{title:"溶液的浓度"}]},
 {unit:"第十单元 酸和碱",lessons:[{title:"常见的酸和碱",parts:["常见的酸","常见的碱"]},{title:"酸和碱的中和反应"}]},
 {unit:"第十一单元 盐 化肥",lessons:[{title:"生活中常见的盐"},{title:"化学肥料"}]},
 {unit:"第十二单元 化学与生活",lessons:[{title:"人类重要的营养物质"},{title:"化学元素与人体健康"},{title:"有机合成材料"}]}]
}};

/* ———————— 初中生物 / 历史 / 地理 / 道法（单元级） ———————— */
catalog["初中"]["生物"] = { "人教版":{
"七上":[{unit:"第一单元 生物和生物圈",lessons:[{title:"认识生物"},{title:"了解生物圈"}]},{unit:"第二单元 生物体的结构层次",lessons:[{title:"细胞是生命活动的基本单位"},{title:"细胞怎样构成生物体"}]},{unit:"第三单元 生物圈中的绿色植物",lessons:[{title:"生物圈中有哪些绿色植物"},{title:"被子植物的一生"},{title:"绿色植物与生物圈的水循环"},{title:"绿色植物是生物圈中有机物的制造者"},{title:"绿色植物与生物圈中的碳—氧平衡"}]}],
"七下":[{unit:"第四单元 生物圈中的人",lessons:[{title:"人的由来"},{title:"人体的营养"},{title:"人体的呼吸"},{title:"人体内物质的运输"},{title:"人体内废物的排出"},{title:"人体生命活动的调节"},{title:"人类活动对生物圈的影响"}]}],
"八上":[{unit:"第五单元 生物圈中的其他生物",lessons:[{title:"动物的主要类群"},{title:"动物的运动和行为"},{title:"动物在生物圈中的作用"},{title:"细菌和真菌"},{title:"病毒"}]}],
"八下":[{unit:"第七单元 生物圈中生命的延续和发展",lessons:[{title:"生物的生殖和发育"},{title:"生物的遗传与变异"},{title:"生命起源和生物进化"}]},{unit:"第八单元 健康地生活",lessons:[{title:"传染病和免疫"},{title:"用药与急救"},{title:"了解自己，增进健康"}]}]
}};
catalog["初中"]["历史"] = { "统编版（人教）":{
"七上":[{unit:"第一单元 史前时期",lessons:[{title:"中国境内早期人类的代表——北京人"},{title:"原始农耕生活"},{title:"远古的传说"}]},{unit:"第二单元 夏商周时期",lessons:[{title:"夏商周的更替"},{title:"青铜器与甲骨文"},{title:"动荡的春秋时期"},{title:"战国时期的社会变化"},{title:"百家争鸣"}]},{unit:"第三单元 秦汉时期",lessons:[{title:"秦统一中国"},{title:"秦末农民大起义"},{title:"西汉建立和“文景之治”"},{title:"汉武帝巩固大一统王朝"},{title:"东汉的兴衰"},{title:"沟通中外文明的“丝绸之路”"},{title:"两汉的科技和文化"}]},{unit:"第四单元 三国两晋南北朝时期",lessons:[{title:"三国鼎立"},{title:"西晋的短暂统一和北方各族的内迁"},{title:"东晋南朝时期江南地区的开发"},{title:"北魏政治和北方民族大交融"},{title:"魏晋南北朝的科技与文化"}]}],
"八上":[{unit:"第一单元",lessons:[{title:"鸦片战争"},{title:"第二次鸦片战争"},{title:"太平天国运动"}]},{unit:"第二单元",lessons:[{title:"洋务运动"},{title:"甲午中日战争与列强瓜分中国狂潮"},{title:"戊戌变法"},{title:"八国联军侵华与《辛丑条约》签订"}]},{unit:"第三、四单元",lessons:[{title:"革命先行者孙中山"},{title:"辛亥革命"},{title:"中华民国的创建"},{title:"新文化运动"},{title:"五四运动"},{title:"中国共产党诞生"}]},{unit:"第五、六单元",lessons:[{title:"国共合作与北伐战争"},{title:"毛泽东开辟井冈山道路"},{title:"中国工农红军长征"},{title:"从九一八事变到西安事变"},{title:"七七事变与全民族抗战"},{title:"正面战场和敌后战场的抗战"},{title:"抗日战争的胜利"}]},{unit:"第七、八单元",lessons:[{title:"内战爆发"},{title:"人民解放战争的胜利"},{title:"经济和社会生活的变化"},{title:"教育文化事业的发展"}]}],
"九上":[{unit:"世界古代史",lessons:[{title:"古代埃及"},{title:"古代两河流域"},{title:"古代印度"},{title:"希腊城邦和亚历山大帝国"},{title:"罗马城邦和罗马帝国"},{title:"希腊罗马古典文化"}]},{unit:"世界近代史（上）",lessons:[{title:"西欧经济和社会的发展"},{title:"文艺复兴运动"},{title:"探寻新航路"},{title:"早期殖民掠夺"},{title:"君主立宪制的英国"},{title:"美国的独立"},{title:"法国大革命和拿破仑帝国"},{title:"第一次工业革命"}]}],
"九下":[{unit:"世界近代史（下）",lessons:[{title:"马克思主义的诞生和国际共产主义运动的兴起"},{title:"俄国的改革"},{title:"美国内战"},{title:"日本明治维新"},{title:"第二次工业革命"},{title:"第一次世界大战"}]},{unit:"世界现代史",lessons:[{title:"十月革命"},{title:"苏联的社会主义建设"},{title:"经济大危机和第二次世界大战"},{title:"冷战"},{title:"战后资本主义的新变化"},{title:"社会主义的发展与挫折"},{title:"亚非拉国家的新发展"},{title:"联合国与世界贸易组织"},{title:"冷战结束后的世界"}]}]
}};
catalog["初中"]["地理"] = { "人教版":{
"七上":[{unit:"第一章 地球和地图",lessons:[{title:"地球和地球仪"},{title:"地球的运动"},{title:"地图的阅读"},{title:"地形图的判读"}]},{unit:"第二章 陆地和海洋",lessons:[{title:"大洲和大洋"},{title:"海陆的变迁"}]},{unit:"第三章 天气与气候",lessons:[{title:"多变的天气"},{title:"气温的变化与分布"},{title:"降水的变化与分布"},{title:"世界的气候"}]},{unit:"第四、五章",lessons:[{title:"人口与人种"},{title:"世界的语言和宗教"},{title:"人类的聚居地——聚落"},{title:"发展与合作"}]}],
"八上":[{unit:"第一章 从世界看中国",lessons:[{title:"疆域"},{title:"人口"},{title:"民族"}]},{unit:"第二章 中国的自然环境",lessons:[{title:"地形和地势"},{title:"气候"},{title:"河流"},{title:"自然灾害"}]},{unit:"第三章 中国的自然资源",lessons:[{title:"自然资源的基本特征"},{title:"土地资源"},{title:"水资源"}]},{unit:"第四章 中国的经济发展",lessons:[{title:"交通运输"},{title:"农业"},{title:"工业"}]}],
"八下":[{unit:"第五章",lessons:[{title:"中国的地理差异"}]},{unit:"第六章 北方地区",lessons:[{title:"自然特征与农业"},{title:"“白山黑水”——东北三省"},{title:"世界最大的黄土堆积区——黄土高原"},{title:"祖国的首都——北京"}]},{unit:"第七章 南方地区",lessons:[{title:"自然特征与农业"},{title:"“鱼米之乡”——长江三角洲地区"},{title:"“东方明珠”——香港和澳门"},{title:"祖国的神圣领土——台湾省"}]},{unit:"第八、九、十章",lessons:[{title:"西北地区"},{title:"青藏地区"},{title:"中国在世界中"}]}]
}};
catalog["初中"]["道德与法治"] = { "统编版（人教）":{
"七上":[{unit:"成长的节拍",lessons:[{title:"中学时代"},{title:"学习新天地"},{title:"发现自己"}]},{unit:"友谊的天空",lessons:[{title:"友谊与成长同行"},{title:"交友的智慧"}]},{unit:"师长情谊",lessons:[{title:"师生之间"},{title:"亲情之爱"}]},{unit:"生命的思考",lessons:[{title:"探问生命"},{title:"珍视生命"},{title:"绽放生命之花"}]}],
"八上":[{unit:"走进社会生活",lessons:[{title:"丰富的社会生活"},{title:"网络生活新空间"}]},{unit:"遵守社会规则",lessons:[{title:"社会生活离不开规则"},{title:"社会生活讲道德"},{title:"做守法的公民"}]},{unit:"勇担社会责任",lessons:[{title:"责任与角色同在"},{title:"积极奉献社会"}]},{unit:"维护国家利益",lessons:[{title:"国家利益至上"},{title:"树立总体国家安全观"},{title:"建设美好祖国"}]}],
"九上":[{unit:"富强与创新",lessons:[{title:"踏上强国之路"},{title:"创新驱动发展"}]},{unit:"民主与法治",lessons:[{title:"追求民主价值"},{title:"建设法治中国"}]},{unit:"文明与家园",lessons:[{title:"守望精神家园"},{title:"建设美丽中国"}]},{unit:"和谐与梦想",lessons:[{title:"中华一家亲"},{title:"中国人 中国梦"}]}]
}};

/* ———————— 高中（2019 新教材） ———————— */
catalog["高中"]["语文"] = { "统编版（人教）":{
"必修上册":[{unit:"第一单元",lessons:[{title:"沁园春·长沙"},{title:"立在地球边上放号"},{title:"红烛"},{title:"峨日朵雪峰之侧"},{title:"百合花"},{title:"哦，香雪"}]},
 {unit:"第二单元",lessons:[{title:"喜看稻菽千重浪"},{title:"心有一团火，温暖众人心"},{title:"“探界者”钟扬"},{title:"以工匠精神雕琢时代品质"}]},
 {unit:"第三单元",lessons:[{title:"短歌行"},{title:"归园田居（其一）"},{title:"梦游天姥吟留别"},{title:"登高"},{title:"琵琶行并序"},{title:"念奴娇·赤壁怀古"},{title:"永遇乐·京口北固亭怀古"},{title:"声声慢"}]},
 {unit:"第四单元",lessons:[{title:"家乡文化生活（记录家乡的人和物/访谈/考察）"}]},
 {unit:"第五单元",lessons:[{title:"《乡土中国》整本书阅读"}]},
 {unit:"第六单元",lessons:[{title:"劝学"},{title:"师说"},{title:"反对党八股（节选）"},{title:"拿来主义"},{title:"读书：目的和前提"},{title:"上图书馆"}]},
 {unit:"第七单元",lessons:[{title:"故都的秋"},{title:"荷塘月色"},{title:"我与地坛（节选）"},{title:"赤壁赋"},{title:"登泰山记"}]},
 {unit:"第八单元",lessons:[{title:"词语积累与词语解释"}]}],
"必修下册":[{unit:"第一单元",lessons:[{title:"子路、曾皙、冉有、公西华侍坐"},{title:"齐桓晋文之事"},{title:"庖丁解牛"},{title:"烛之武退秦师"},{title:"鸿门宴"}]},
 {unit:"第二单元",lessons:[{title:"窦娥冤（节选）"},{title:"雷雨（节选）"},{title:"哈姆莱特（节选）"}]},
 {unit:"第三单元",lessons:[{title:"青蒿素：人类征服疾病的一小步"},{title:"一名物理学家的教育历程"},{title:"中国建筑的特征"},{title:"说“木叶”"}]},
 {unit:"第四单元",lessons:[{title:"信息时代的语文生活"}]},
 {unit:"第五单元",lessons:[{title:"在《人民报》创刊纪念会上的演说"},{title:"在马克思墓前的讲话"},{title:"谏逐客书"},{title:"与妻书"}]},
 {unit:"第六单元",lessons:[{title:"祝福"},{title:"林教头风雪山神庙"},{title:"装在套子里的人"},{title:"促织"},{title:"变形记（节选）"}]},
 {unit:"第七单元",lessons:[{title:"《红楼梦》整本书阅读"}]},
 {unit:"第八单元",lessons:[{title:"谏太宗十思疏"},{title:"答司马谏议书"},{title:"阿房宫赋"},{title:"六国论"}]}],
"选择性必修上册":[{unit:"第一单元",lessons:[{title:"中国人民站起来了"},{title:"长征胜利万岁"},{title:"大战中的插曲"},{title:"别了，“不列颠尼亚”"},{title:"县委书记的榜样——焦裕禄"}]},{unit:"第二单元",lessons:[{title:"《论语》十二章"},{title:"大学之道"},{title:"人皆有不忍人之心"},{title:"《老子》四章"},{title:"五石之瓠"},{title:"兼爱"}]},{unit:"第三单元",lessons:[{title:"大卫·科波菲尔（节选）"},{title:"复活（节选）"},{title:"老人与海（节选）"},{title:"百年孤独（节选）"}]},{unit:"第四单元",lessons:[{title:"逻辑的力量"}]}],
"选择性必修中册":[{unit:"第一单元",lessons:[{title:"社会历史的决定性基础"},{title:"改造我们的学习"},{title:"人的正确思想是从哪里来的？"},{title:"实践是检验真理的唯一标准"},{title:"修辞立其诚"},{title:"怜悯是人的天性"}]},{unit:"第二单元",lessons:[{title:"记念刘和珍君"},{title:"为了忘却的记念"},{title:"包身工"},{title:"荷花淀"},{title:"小二黑结婚"},{title:"党费"}]},{unit:"第三单元",lessons:[{title:"屈原列传"},{title:"苏武传"},{title:"过秦论"},{title:"五代史伶官传序"}]},{unit:"第四单元",lessons:[{title:"玩偶之家（节选）"},{title:"迷娘（之一）"},{title:"致大海"},{title:"自己之歌（节选）"},{title:"树和天空"}]}],
"选择性必修下册":[{unit:"第一单元",lessons:[{title:"氓"},{title:"离骚（节选）"},{title:"孔雀东南飞并序"},{title:"蜀道难"},{title:"蜀相"},{title:"望海潮"},{title:"扬州慢"}]},{unit:"第二单元",lessons:[{title:"阿Q正传（节选）"},{title:"边城（节选）"},{title:"大堰河——我的保姆"},{title:"再别康桥"},{title:"一个消逝了的山村"},{title:"秦腔"}]},{unit:"第三单元",lessons:[{title:"陈情表"},{title:"项脊轩志"},{title:"兰亭集序"},{title:"归去来兮辞并序"},{title:"种树郭橐驼传"},{title:"石钟山记"}]},{unit:"第四单元",lessons:[{title:"自然选择的证明"},{title:"宇宙的边疆"},{title:"天文学上的旷世之争"}]}]
}};
catalog["高中"]["数学"] = { "人教A版":{
"必修第一册":[{unit:"第一章 集合与常用逻辑用语",lessons:[{title:"集合的概念"},{title:"集合间的基本关系"},{title:"集合的基本运算"},{title:"充分条件与必要条件"},{title:"全称量词与存在量词"}]},
 {unit:"第二章 一元二次函数、方程和不等式",lessons:[{title:"等式性质与不等式性质"},{title:"基本不等式"},{title:"二次函数与一元二次方程、不等式"}]},
 {unit:"第三章 函数的概念与性质",lessons:[{title:"函数的概念及其表示"},{title:"函数的基本性质",parts:["单调性","奇偶性"]},{title:"幂函数"},{title:"函数的应用（一）"}]},
 {unit:"第四章 指数函数与对数函数",lessons:[{title:"指数"},{title:"指数函数"},{title:"对数"},{title:"对数函数"},{title:"函数的应用（二）"}]},
 {unit:"第五章 三角函数",lessons:[{title:"任意角和弧度制"},{title:"三角函数的概念"},{title:"诱导公式"},{title:"三角函数的图象与性质"},{title:"三角恒等变换"},{title:"函数 y=Asin(ωx+φ)"},{title:"三角函数的应用"}]}],
"必修第二册":[{unit:"第六章 平面向量及其应用",lessons:[{title:"平面向量的概念"},{title:"平面向量的运算"},{title:"平面向量基本定理及坐标表示"},{title:"平面向量的应用"}]},
 {unit:"第七章 复数",lessons:[{title:"复数的概念"},{title:"复数的四则运算"},{title:"复数的三角表示"}]},
 {unit:"第八章 立体几何初步",lessons:[{title:"基本立体图形"},{title:"立体图形的直观图"},{title:"简单几何体的表面积与体积"},{title:"空间点、直线、平面之间的位置关系"},{title:"空间直线、平面的平行"},{title:"空间直线、平面的垂直"}]},
 {unit:"第九章 统计",lessons:[{title:"随机抽样"},{title:"用样本估计总体"}]},
 {unit:"第十章 概率",lessons:[{title:"随机事件与概率"},{title:"事件的相互独立性"},{title:"频率与概率"}]}],
"选择性必修第一册":[{unit:"第一章 空间向量与立体几何",lessons:[{title:"空间向量及其运算"},{title:"空间向量基本定理"},{title:"空间向量及其运算的坐标表示"},{title:"空间向量的应用"}]},{unit:"第二章 直线和圆的方程",lessons:[{title:"直线的倾斜角与斜率"},{title:"直线的方程"},{title:"直线的交点坐标与距离公式"},{title:"圆的方程"},{title:"直线与圆、圆与圆的位置关系"}]},{unit:"第三章 圆锥曲线的方程",lessons:[{title:"椭圆"},{title:"双曲线"},{title:"抛物线"}]}],
"选择性必修第二册":[{unit:"第四章 数列",lessons:[{title:"数列的概念"},{title:"等差数列"},{title:"等比数列"},{title:"数学归纳法"}]},{unit:"第五章 一元函数的导数及其应用",lessons:[{title:"导数的概念及其意义"},{title:"导数的运算"},{title:"导数在研究函数中的应用"}]}],
"选择性必修第三册":[{unit:"第六章 计数原理",lessons:[{title:"分类加法计数原理与分步乘法计数原理"},{title:"排列与组合"},{title:"二项式定理"}]},{unit:"第七章 随机变量及其分布",lessons:[{title:"条件概率与全概率公式"},{title:"离散型随机变量及其分布列"},{title:"二项分布与超几何分布"},{title:"正态分布"}]},{unit:"第八章 成对数据的统计分析",lessons:[{title:"成对数据的统计相关性"},{title:"一元线性回归模型及其应用"},{title:"列联表与独立性检验"}]}]
}};
catalog["高中"]["英语"] = { "人教版":{
"必修第一册":[{unit:"Welcome Unit",lessons:[{title:"Welcome Unit"}]},{unit:"Unit 1",lessons:[{title:"Teenage Life"}]},{unit:"Unit 2",lessons:[{title:"Travelling Around"}]},{unit:"Unit 3",lessons:[{title:"Sports and Fitness"}]},{unit:"Unit 4",lessons:[{title:"Natural Disasters"}]},{unit:"Unit 5",lessons:[{title:"Languages Around the World"}]}],
"必修第二册":[{unit:"Unit 1",lessons:[{title:"Cultural Heritage"}]},{unit:"Unit 2",lessons:[{title:"Wildlife Protection"}]},{unit:"Unit 3",lessons:[{title:"The Internet"}]},{unit:"Unit 4",lessons:[{title:"History and Traditions"}]},{unit:"Unit 5",lessons:[{title:"Music"}]}],
"必修第三册":[{unit:"Unit 1",lessons:[{title:"Festivals and Celebrations"}]},{unit:"Unit 2",lessons:[{title:"Morals and Virtues"}]},{unit:"Unit 3",lessons:[{title:"Diverse Cultures"}]},{unit:"Unit 4",lessons:[{title:"Space Exploration"}]},{unit:"Unit 5",lessons:[{title:"The Value of Money"}]}],
"选择性必修第一册":[{unit:"Unit 1",lessons:[{title:"People of Achievement"}]},{unit:"Unit 2",lessons:[{title:"Looking into the Future"}]},{unit:"Unit 3",lessons:[{title:"Fascinating Parks"}]},{unit:"Unit 4",lessons:[{title:"Body Language"}]},{unit:"Unit 5",lessons:[{title:"Working the Land"}]}],
"选择性必修第二册":[{unit:"Unit 1",lessons:[{title:"Science and Scientists"}]},{unit:"Unit 2",lessons:[{title:"Bridging Cultures"}]},{unit:"Unit 3",lessons:[{title:"Food and Culture"}]},{unit:"Unit 4",lessons:[{title:"Journey Across a Vast Land"}]},{unit:"Unit 5",lessons:[{title:"First Aid"}]}]
}};
/* 高中日语/俄语 */
catalog["高中"]["日语"] = { "人教版":{
"必修第一册":[{unit:"第1单元",lessons:[{title:"あいさつ"},{title:"自己紹介"}]},{unit:"第2单元",lessons:[{title:"学校生活"},{title:"部活動"}]},{unit:"第3单元",lessons:[{title:"家族"},{title:"友達"}]},{unit:"第4单元",lessons:[{title:"買い物"},{title:"日本の四季"}]}],
"必修第二册":[{unit:"第5单元",lessons:[{title:"趣味"},{title:"スポーツ"}]},{unit:"第6单元",lessons:[{title:"旅行"},{title:"交通"}]},{unit:"第7单元",lessons:[{title:"日本の文化"},{title:"祭り"}]},{unit:"第8单元",lessons:[{title:"環境問題"},{title:"将来の夢"}]}]
}};
catalog["高中"]["俄语"] = { "人教版":{
"必修第一册":[{unit:"Урок 1-4",lessons:[{title:"Приветствие"},{title:"Знакомство"}]},{unit:"Урок 5-8",lessons:[{title:"Семья"},{title:"Школа"}]},{unit:"Урок 9-12",lessons:[{title:"Дом"},{title:"Город"}]}]
}};
/* 高中物理/化学/生物/思想政治/历史/地理（章级） */
catalog["高中"]["物理"] = { "人教版":{
"必修第一册":[{unit:"第一章 运动的描述",lessons:[{title:"质点 参考系"},{title:"时间 位移"},{title:"位置变化快慢的描述——速度"},{title:"速度变化快慢的描述——加速度"}]},{unit:"第二章 匀变速直线运动的研究",lessons:[{title:"实验：探究小车速度随时间变化的规律"},{title:"匀变速直线运动的速度与时间的关系"},{title:"匀变速直线运动的位移与时间的关系"},{title:"自由落体运动"}]},{unit:"第三章 相互作用——力",lessons:[{title:"重力与弹力"},{title:"摩擦力"},{title:"牛顿第三定律"},{title:"力的合成和分解"},{title:"共点力的平衡"}]},{unit:"第四章 运动和力的关系",lessons:[{title:"牛顿第一定律"},{title:"实验：探究加速度与力、质量的关系"},{title:"牛顿第二定律"},{title:"力学单位制"},{title:"牛顿运动定律的应用"},{title:"超重和失重"}]}],
"必修第二册":[{unit:"第五章 抛体运动",lessons:[{title:"曲线运动"},{title:"运动的合成与分解"},{title:"实验：探究平抛运动的特点"},{title:"抛体运动的规律"}]},{unit:"第六章 圆周运动",lessons:[{title:"圆周运动"},{title:"向心力"},{title:"向心加速度"},{title:"生活中的圆周运动"}]},{unit:"第七章 万有引力与宇宙航行",lessons:[{title:"行星的运动"},{title:"万有引力定律"},{title:"万有引力理论的成就"},{title:"宇宙航行"},{title:"相对论时空观与牛顿力学的局限性"}]},{unit:"第八章 机械能守恒定律",lessons:[{title:"功与功率"},{title:"重力势能"},{title:"动能和动能定理"},{title:"机械能守恒定律"},{title:"实验：验证机械能守恒定律"}]}],
"必修第三册":[{unit:"第九章 静电场及其应用",lessons:[{title:"电荷"},{title:"库仑定律"},{title:"电场 电场强度"},{title:"静电的防止与利用"}]},{unit:"第十章 静电场中的能量",lessons:[{title:"电势能和电势"},{title:"电势差"},{title:"电势差与电场强度的关系"},{title:"电容器的电容"},{title:"带电粒子在电场中的运动"}]},{unit:"第十一章 电路及其应用",lessons:[{title:"电源和电流"},{title:"导体的电阻"},{title:"实验：导体电阻率的测量"},{title:"串联电路和并联电路"},{title:"实验：练习使用多用电表"}]},{unit:"第十二、十三章",lessons:[{title:"电能 能量守恒定律"},{title:"电磁感应现象初步"},{title:"电磁振荡与电磁波"},{title:"能量量子化"}]}]
}};
catalog["高中"]["化学"] = { "人教版":{
"必修第一册":[{unit:"第一章 物质及其变化",lessons:[{title:"物质的分类及转化"},{title:"离子反应"},{title:"氧化还原反应"}]},{unit:"第二章 海水中的重要元素——钠和氯",lessons:[{title:"钠及其化合物"},{title:"氯及其化合物"},{title:"物质的量"}]},{unit:"第三章 铁 金属材料",lessons:[{title:"铁及其化合物"},{title:"金属材料"}]},{unit:"第四章 物质结构 元素周期律",lessons:[{title:"原子结构与元素周期表"},{title:"元素周期律"},{title:"化学键"}]}],
"必修第二册":[{unit:"第五章 化工生产中的重要非金属元素",lessons:[{title:"硫及其化合物"},{title:"氮及其化合物"},{title:"无机非金属材料"}]},{unit:"第六章 化学反应与能量",lessons:[{title:"化学反应与能量变化"},{title:"化学反应的速率与限度"}]},{unit:"第七章 有机化合物",lessons:[{title:"认识有机化合物"},{title:"乙烯与有机高分子材料"},{title:"乙醇与乙酸"},{title:"基本营养物质"}]},{unit:"第八章 化学与可持续发展",lessons:[{title:"自然资源的开发利用"},{title:"化学品的合理使用"},{title:"环境保护与绿色化学"}]}],
"选择性必修1":[{unit:"化学反应原理",lessons:[{title:"化学反应的热效应"},{title:"化学反应速率与化学平衡"},{title:"水溶液中的离子反应与平衡"},{title:"化学反应与电能"}]}],
"选择性必修2":[{unit:"物质结构与性质",lessons:[{title:"原子结构与性质"},{title:"分子结构与性质"},{title:"晶体结构与性质"}]}],
"选择性必修3":[{unit:"有机化学基础",lessons:[{title:"有机化合物的结构特点与研究方法"},{title:"烃"},{title:"烃的衍生物"},{title:"生物大分子"},{title:"合成高分子"}]}]
}};
catalog["高中"]["生物"] = { "人教版":{
"必修1":[{unit:"分子与细胞",lessons:[{title:"走近细胞"},{title:"组成细胞的分子"},{title:"细胞的基本结构"},{title:"细胞的物质输入和输出"},{title:"细胞的能量供应和利用"},{title:"细胞的生命历程"}]}],
"必修2":[{unit:"遗传与进化",lessons:[{title:"遗传因子的发现"},{title:"基因和染色体的关系"},{title:"基因的本质"},{title:"基因的表达"},{title:"基因突变及其他变异"},{title:"生物的进化"}]}],
"选择性必修1":[{unit:"稳态与调节",lessons:[{title:"人体的内环境与稳态"},{title:"神经调节"},{title:"体液调节"},{title:"免疫调节"},{title:"植物生命活动的调节"}]}],
"选择性必修2":[{unit:"生物与环境",lessons:[{title:"种群及其动态"},{title:"群落及其演替"},{title:"生态系统及其稳定性"},{title:"人与环境"}]}],
"选择性必修3":[{unit:"生物技术与工程",lessons:[{title:"发酵工程"},{title:"细胞工程"},{title:"基因工程"},{title:"生物技术的安全性与伦理问题"}]}]
}};
catalog["高中"]["思想政治"] = { "统编版（人教）":{
"必修1":[{unit:"中国特色社会主义",lessons:[{title:"社会主义从空想到科学、从理论到实践的发展"},{title:"只有社会主义才能救中国"},{title:"只有中国特色社会主义才能发展中国"},{title:"只有坚持和发展中国特色社会主义才能实现中华民族伟大复兴"}]}],
"必修2":[{unit:"经济与社会",lessons:[{title:"生产资料所有制与经济体制"},{title:"经济发展与社会进步"}]}],
"必修3":[{unit:"政治与法治",lessons:[{title:"中国共产党的领导"},{title:"人民当家作主"},{title:"全面依法治国"}]}],
"必修4":[{unit:"哲学与文化",lessons:[{title:"探索世界与把握规律"},{title:"认识社会与价值选择"},{title:"文化传承与文化创新"}]}],
"选择性必修1":[{unit:"当代国际政治与经济",lessons:[{title:"各具特色的国家"},{title:"世界多极化"},{title:"经济全球化"},{title:"国际组织"}]}]
}};
catalog["高中"]["历史"] = { "统编版（人教）":{
"中外历史纲要（上）":[{unit:"中国史",lessons:[{title:"中华文明的起源与早期国家"},{title:"诸侯纷争与变法运动"},{title:"秦统一多民族封建国家的建立"},{title:"三国两晋南北朝的民族交融"},{title:"隋唐统一多民族封建国家的发展"},{title:"辽宋夏金元的统治"},{title:"明至清中叶的经济与文化"},{title:"两次鸦片战争"},{title:"辛亥革命"},{title:"五四运动与中国共产党的诞生"},{title:"中华民族的抗日战争"},{title:"人民解放战争"},{title:"中华人民共和国成立和社会主义革命与建设"},{title:"改革开放与社会主义现代化建设新时期"}]}],
"中外历史纲要（下）":[{unit:"世界史",lessons:[{title:"文明的产生与早期发展"},{title:"中古时期的世界"},{title:"全球航路的开辟"},{title:"资本主义制度的确立"},{title:"工业革命与马克思主义的诞生"},{title:"世界殖民体系与亚非拉民族独立运动"},{title:"两次世界大战与战后国际秩序"},{title:"冷战与国际格局的演变"},{title:"当代世界发展的特点与主要趋势"}]}]
}};
catalog["高中"]["地理"] = { "人教版":{
"必修第一册":[{unit:"自然地理基础",lessons:[{title:"地球的宇宙环境"},{title:"太阳对地球的影响"},{title:"地球的历史"},{title:"地球的圈层结构"},{title:"大气的组成和垂直分层"},{title:"大气受热过程和大气运动"},{title:"水循环"},{title:"海水的性质和运动"},{title:"植被"},{title:"土壤"},{title:"气象灾害"},{title:"地质灾害"}]}],
"必修第二册":[{unit:"人文地理基础",lessons:[{title:"人口分布与迁移"},{title:"城镇化"},{title:"农业区位因素及其变化"},{title:"工业区位因素及其变化"},{title:"服务业区位因素及其变化"},{title:"交通运输布局与区域发展"},{title:"人类面临的主要环境问题"},{title:"走向人地协调——可持续发展"}]}],
"选择性必修1":[{unit:"自然地理基础",lessons:[{title:"地球的自转和公转"},{title:"地表形态的塑造"},{title:"大气的运动"},{title:"水的运动"},{title:"自然环境的整体性与差异性"}]}],
"选择性必修2":[{unit:"区域发展",lessons:[{title:"区域与区域发展"},{title:"资源、环境与区域发展"},{title:"城市、产业与区域发展"},{title:"区际联系与区域协调发展"}]}]
}};
catalog["高中"]["信息技术"] = { "人教版":{
"必修1":[{unit:"数据与计算",lessons:[{title:"数据与信息"},{title:"数据处理与可视化"},{title:"算法与程序实现"}]}],
"必修2":[{unit:"信息系统与社会",lessons:[{title:"信息系统的组成与功能"},{title:"信息系统的集成"},{title:"信息系统的设计与开发"},{title:"信息社会的责任"}]}]
}};
catalog["高中"]["通用技术"] = { "苏教版":{
"必修1":[{unit:"技术与设计1",lessons:[{title:"走进技术世界"},{title:"技术世界中的设计"},{title:"设计过程、原则及评价"},{title:"发现与明确问题"},{title:"方案的构思及其方法"}]}],
"必修2":[{unit:"技术与设计2",lessons:[{title:"结构及其设计"},{title:"流程及其设计"},{title:"系统及其设计"},{title:"控制及其设计"}]}]
}};


/** 查询：版本无独立目录时回落到该学科第一个版本（人教版系） */
export function get(stage: string, subject: string, version: string, gradeKey: string): Unit[] | null {
  const s = catalog[stage]; if (!s) return null;
  const sub = s[subject]; if (!sub) return null;
  const v = sub[version] || sub[Object.keys(sub)[0]];
  if (!v) return null;
  return v[gradeKey] || null;
}
export function hasCatalog(stage: string, subject: string): boolean {
  const s = catalog[stage]; return !!(s && s[subject]);
}
/** 某学科在某学段下可用的册键（高中选册用） */
export function bookKeys(stage: string, subject: string, version: string): string[] {
  const sub = catalog[stage]?.[subject];
  if (!sub) return [];
  const v = sub[version] || sub[Object.keys(sub)[0]];
  return v ? Object.keys(v) : [];
}
