/**
 * 遊戲狀態機與邏輯運算模組 (GameEngine)
 * 負責維護 AP、CD、回合判定與棋盤陣列，不涉及 DOM 與網路操作
 */
export class GameEngine {
    constructor() {
        this.maxAP = 3;
        this.currentAP = 0;
        this.board = Array.from({ length: 8 }, () => Array(8).fill(null));
        this.deck = [];
        this.hand = [];
        this.isHost = false;
        this.isMyTurn = false;
        
        this.kingPositions = {
            HOST: { x: 0, y: 0 },
            GUEST: { x: 7, y: 7 }
        };
    }

    initGame(isHost, initialDeck) {
        this.isHost = isHost;
        this.deck = this._shuffleArray([...initialDeck]);

        this.board[this.kingPositions.HOST.y][this.kingPositions.HOST.x] = { type: '君主', owner: 'HOST', hp: 10 };
        this.board[this.kingPositions.GUEST.y][this.kingPositions.GUEST.x] = { type: '君主', owner: 'GUEST', hp: 10 };

        this.drawCard(3);

        if (isHost) {
            this.startTurn();
        } else {
            this.isMyTurn = false;
            this.currentAP = 0;
        }
    }

    startTurn() {
        this.isMyTurn = true;
        this.currentAP = this.maxAP;
        
        this.hand.forEach(card => {
            if (card.currentCD > 0) card.currentCD--;
        });
        
        this.drawCard(1);
        return this.getState();
    }

    endTurn() {
        // [Bug 修復] 嚴格驗證，防止非己方回合強制觸發
        if (!this.isMyTurn) return this.getState();
        
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

    playCard(cardId, x, y) {
        if (!this.isMyTurn) return { success: false, reason: '現在不是您的回合' };
        if (this.currentAP < 1) return { success: false, reason: '行動點數 (AP) 不足' };
        
        const cardIndex = this.hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return { success: false, reason: '手牌中找不到該卡牌' };
        
        const card = this.hand[cardIndex];
        if (card.currentCD > 0) return { success: false, reason: '卡牌仍在冷卻中' };
        if (card.type === 'SOLDIER') {
            if (this.board[y][x] !== null) {
                return { success: false, reason: '該座標已有其他單位' };
            }
            const myKingPos = this.isHost ? this.kingPositions.HOST : this.kingPositions.GUEST;
            const dx = Math.abs(x - myKingPos.x);
            const dy = Math.abs(y - myKingPos.y);
            
            if (dx > 1 || dy > 1 || (dx === 0 && dy === 0)) {
                return { success: false, reason: '士兵只能召喚在己方君主周圍的相鄰空格內' };
            }
        }
        this.currentAP -= 1;
        this.hand.splice(cardIndex, 1);
        if (card.type === 'SOLDIER') {
            this.board[y][x] = { type: card.name, owner: this.isHost ? 'HOST' : 'GUEST', hp: 5 };
        } else if (card.type === 'SKILL') {
            console.log(`發動技能卡: ${card.name}，目標座標: [${x}, ${y}]`);
        }

        return { success: true, updatedHand: this.hand, currentAP: this.currentAP, playedCard: card };
    }

    syncOpponentPlay(x, y, cardName, cardType) {
        if (cardType === 'SOLDIER') {
            this.board[y][x] = { type: cardName, owner: this.isHost ? 'GUEST' : 'HOST', hp: 5 };
        }
    }

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
