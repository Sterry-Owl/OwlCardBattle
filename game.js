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
     */
    initGame(isHost, initialDeck) {
        this.isHost = isHost;
        this.deck = this._shuffleArray([...initialDeck]);

        // 初始化君主位置
        this.board[this.kingPositions.HOST.y][this.kingPositions.HOST.x] = { type: '君主', owner: 'HOST', hp: 10 };
        this.board[this.kingPositions.GUEST.y][this.kingPositions.GUEST.x] = { type: '君主', owner: 'GUEST', hp: 10 };

        this.drawCard(3);

        // 若為房主，直接啟動第一回合
        if (isHost) {
            this.startTurn();
        } else {
            this.isMyTurn = false;
            this.currentAP = 0;
        }
    }

    /**
     * 回合開始邏輯 (重置 AP, CD 減 1, 抽 1 張卡)
     */
    startTurn() {
        this.isMyTurn = true;
        this.currentAP = this.maxAP;
        
        // 手牌 CD 減 1
        this.hand.forEach(card => {
            if (card.currentCD > 0) card.currentCD--;
        });
        
        this.drawCard(1);
        return this.getState();
    }

    /**
     * 回合結束邏輯
     */
    endTurn() {
        this.isMyTurn = false;
        return this.getState();
    }

    _shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    drawCard(count) {
        for (let i = 0; i < count; i++) {
            if (this.deck.length === 0) break;
            const card = this.deck.pop();
            if (this.hand.length < 6) {
                this.hand.push(card);
            } else {
                console.log(`手牌已達 6 張上限，卡牌溢出捨棄: ${card.name}`);
            }
        }
    }

    /**
     * 嘗試打出卡牌
     */
    playCard(cardId, x, y) {
        if (!this.isMyTurn) return { success: false, reason: '現在不是您的回合' };
        if (this.currentAP < 1) return { success: false, reason: '行動點數 (AP) 不足' };
        if (this.board[y][x] !== null) return { success: false, reason: '該座標已有其他單位' };

        const cardIndex = this.hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return { success: false, reason: '手牌中找不到該卡牌' };
        
        const card = this.hand[cardIndex];
        if (card.currentCD > 0) return { success: false, reason: '卡牌仍在冷卻中' };

        this.currentAP -= 1;
        this.board[y][x] = { type: card.name, owner: this.isHost ? 'HOST' : 'GUEST', hp: 5 };
        this.hand.splice(cardIndex, 1);

        return { success: true, updatedHand: this.hand, currentAP: this.currentAP, playedCard: card };
    }

    /**
     * 接收對手出牌指令並寫入本地棋盤陣列
     */
    syncOpponentPlay(x, y, cardName) {
        this.board[y][x] = { type: cardName, owner: this.isHost ? 'GUEST' : 'HOST', hp: 5 };
    }

    /**
     * 取得當前遊戲狀態
     */
    getState() {
        return {
            ap: this.currentAP,
            maxAP: this.maxAP,
            deckCount: this.deck.length,
            hand: this.hand,
            board: this.board,
            isMyTurn: this.isMyTurn
        };
    }
}
