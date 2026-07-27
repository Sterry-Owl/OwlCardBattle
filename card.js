/**
 * 卡牌圖鑑資料庫 (Card Library Database)
 * 儲存所有卡牌的靜態屬性與技能標籤，不包含任何具體的運算邏輯
 */

export const CARD_DATABASE = [
    {
        id: 'h_sol_1',
        name: '哨衛',
        type: 'SOLDIER',
        baseCD: 3,
        hp: 12,
        atk: 3,
        movement: 2,
        attackRange: 2,
        skills: ['HEAVY_ARMOR:2']
    },
    {
        id: 'h_sol_2',
        name: '衛隊長',
        type: 'SOLDIER',
        baseCD: 4,
        hp: 13,
        atk: 3,
        movement: 2,
        attackRange: 2,
        skills: ['HEAVY_ARMOR:3']
    },
    {
        id: 'h_sol_3',
        name: '聖騎士',
        type: 'SOLDIER',
        baseCD: 2,
        hp: 9,
        atk: 2,
        movement: 2,
        attackRange: 2,
        skills: ['VIGILANCE', 'HEAL:2']
    },
    {
        id: 'h_sol_4',
        name: '聖殿騎士',
        type: 'SOLDIER',
        baseCD: 4,
        hp: 9,
        atk: 3,
        movement: 2,
        attackRange: 2,
        skills: ['VIGILANCE', 'HEAL:2', 'HEAVY_ARMOR:1']
    },
    {
        id: 'h_sol_5',
        name: '槍騎士',
        type: 'SOLDIER',
        baseCD: 2,
        hp: 10,
        atk: 3,
        movement: 2,
        attackRange: 2,
        skills: ['MOUNT', 'ASSAULT:1']
    },
    {
        id: 'h_sol_6',
        name: '槍騎隊長',
        type: 'SOLDIER',
        baseCD: 4,
        hp: 10,
        atk: 5,
        movement: 2,
        attackRange: 2,
        skills: ['MOUNT', 'ASSAULT:1']
    },
    {
        id: 'h_sol_7',
        name: '騎士',
        type: 'SOLDIER',
        baseCD: 2,
        hp: 10,
        atk: 1,
        movement: 2,
        attackRange: 2,
        skills: ['MOUNT', 'BRAVE:2']
    },
    {
        id: 'h_sol_8',
        name: '騎士隊長',
        type: 'SOLDIER',
        baseCD: 3,
        hp: 10,
        atk: 2,
        movement: 2,
        attackRange: 2,
        skills: ['MOUNT', 'BRAVE:2']
    }
];

/**
 * 透過 ID 取得卡牌初始資料的工廠函式
 * @param {string} id - 卡牌識別碼
 * @returns {Object|null} - 回傳卡牌物件的深拷貝，避免污染靜態資料庫
 */
export function getCardById(id) {
    const cardDef = CARD_DATABASE.find(c => c.id === id);
    if (!cardDef) return null;
    return JSON.parse(JSON.stringify(cardDef));
}
