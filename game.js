/**
 * 遊戲狀態機與邏輯運算模組 (GameEngine)
 * 負責維護 AP、CD、回合判定與棋盤陣列，不涉及 DOM 與網路操作
 */
export class GameEngine {
    constructor() {
        this.maxAP = 3;
        this.currentAP = 0;
        this.board = Array.from({ length: 8 }, () => Array(8).fill(null));
        this.deck = []; // 玩家專屬牌庫
        this.hand = []; // 當前手牌
        this.isHost = false;
        this.isMyTurn = false;
        
        // 追蹤雙方君主座標 (供未來技能卡判定使用)
        this.kingPositions = {
            HOST: { x: 0, y: 0 },
            GUEST: { x: 7, y: 7 }
        };
    }

    /**
     * 初始化遊戲狀態
     * @param {boolean} isHost - 是否為房主 (決定先後手與初始位置)
     * @param {Array} initialDeck - 玩家進入遊戲前配置的 20 張牌組
     */
    initGame(isHost, initialDeck) {
        this.isHost = isHost;
        this.isMyTurn = isHost; 
        this.currentAP = this.isMyTurn ? this.maxAP : 0;
        
        // 複製傳入的牌組並進行洗牌，形成此局遊戲的牌庫
        this.deck = this._shuffleArray([...initialDeck]);

        // 初始化君主位置 (房主 [0,0]，客機 [7,7]；此為本地視角，未處理畫面翻轉)
        this.board[this.kingPositions.HOST.y][this.kingPositions.HOST.x] = { type: 'KING', owner: 'HOST', hp: 10 };
        this.board[this.kingPositions.GUEST.y][this.kingPositions.GUEST.x] = { type: 'KING', owner: 'GUEST', hp: 10 };

        // 規則：起始抽 3 張牌
        this.drawCard(3);
    }

    /**
     * 內部方法：Fisher-Yates 洗牌演算法
     * @param {Array} array 
     * @returns {Array} 打亂後的陣列
     */
    _shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * 抽卡邏輯
     * @param {number} count - 抽卡數量
     */
    drawCard(count) {
        for (let i = 0; i < count; i++) {
            if (this.deck.length === 0) break; // 牌庫已空
            
            const card = this.deck.pop();
            
            // 規則：手牌上限 6 張
            if (this.hand.length < 6) {
                this.hand.push(card);
            } else {
                console.log(`手牌已達 6 張上限，卡牌溢出捨棄: ${card.name}`);
                // 若未來有墓地系統，可在此處擴充將 card 推進墓地陣列
            }
        }
    }

    /**
     * 嘗試打出卡牌 (驗證規則)
     * @param {string} cardId - 卡牌 ID
     * @param {number} x - 目標 X 座標
     * @param {number} y - 目標 Y 座標
     * @returns {Object} { success: boolean, reason: string, updatedHand: Array }
     */
    playCard(cardId, x, y) {
        if (!this.isMyTurn) return { success: false, reason: '現在不是您的回合' };
        if (this.currentAP < 1) return { success: false, reason: '行動點數 (AP) 不足' };
        if (this.board[y][x] !== null) return { success: false, reason: '該座標已有其他單位' };

        const cardIndex = this.hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return { success: false, reason: '手牌中找不到該卡牌' };
        
        const card = this.hand[cardIndex];
        if (card.currentCD > 0) return { success: false, reason: '卡牌仍在冷卻中' };

        // 扣除 AP，將單位寫入棋盤陣列，並從手牌移除
        this.currentAP -= 1;
        this.board[y][x] = { type: card.name, owner: this.isHost ? 'HOST' : 'GUEST', hp: 5 };
        this.hand.splice(cardIndex, 1);

        return { success: true, updatedHand: this.hand, currentAP: this.currentAP };
    }

    /**
     * 取得當前遊戲狀態 (供 UI 渲染使用)
     */
    getState() {
        return {
            ap: this.currentAP,
            maxAP: this.maxAP,
            deckCount: this.deck.length,
            hand: this.hand,
            isMyTurn: this.isMyTurn
        };
    }
}
