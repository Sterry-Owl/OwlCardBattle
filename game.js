export class GameEngine {
    constructor() {
        this.maxAP = 3;
        this.currentAP = 0;
        this.board = Array.from({ length: 8 }, () => Array(8).fill(null));
        this.hand = [];
        this.isHost = false;
        this.isMyTurn = false;
    }

    /**
     * 初始化遊戲狀態
     * @param {boolean} isHost - 是否為房主 (決定先後手與初始位置)
     */
    initGame(isHost) {
        this.isHost = isHost;
        // 房主先手
        this.isMyTurn = isHost; 
        this.currentAP = this.isMyTurn ? this.maxAP : 0;
        
        // 建立初始測試牌組
        this.hand = [
            { id: `card_${Date.now()}_1`, name: '步兵', currentCD: 0 },
            { id: `card_${Date.now()}_2`, name: '弓箭手', currentCD: 1 },
            { id: `card_${Date.now()}_3`, name: '騎兵', currentCD: 0 }
        ];

        // 初始化君主位置 (房主 [0,0]，客機 [7,7]；此為本地視角，未處理畫面翻轉)
        this.board[0][0] = { type: 'KING', owner: 'HOST', hp: 10 };
        this.board[7][7] = { type: 'KING', owner: 'GUEST', hp: 10 };
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
            hand: this.hand,
            isMyTurn: this.isMyTurn
        };
    }
}
