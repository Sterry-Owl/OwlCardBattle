/**
 * 介面渲染與互動模組 (UIManager)
 * 專責處理 DOM 操作、8x8 棋盤渲染與拖曳事件 (Drag and Drop)
 */
export class UIManager {
    constructor(elements, callbacks = {}) {
        this.boardElement = elements.board;
        this.handContainer = elements.hand;
        this.apDisplay = elements.apDisplay;
        this.btnEndTurn = elements.btnEndTurn;
        this.turnIndicator = elements.turnIndicator;
        
        this.callbacks = {
            onCardDropped: callbacks.onCardDropped || (() => {}),
            onCellClicked: callbacks.onCellClicked || (() => {}),
            onEndTurnClicked: callbacks.onEndTurnClicked || (() => {})
        };

        if (this.btnEndTurn) {
            this.btnEndTurn.addEventListener('click', () => {
                this.callbacks.onEndTurnClicked();
            });
        }
    }

    renderBoard(boardData) {
        this.boardElement.innerHTML = ''; 

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const cell = document.createElement('div');
                cell.classList.add('board-cell');
                cell.dataset.x = x;
                cell.dataset.y = y;

                cell.addEventListener('click', () => {
                    this.callbacks.onCellClicked({ x, y });
                });

                cell.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    cell.classList.add('drag-over');
                });

                cell.addEventListener('dragleave', () => {
                    cell.classList.remove('drag-over');
                });

                cell.addEventListener('drop', (e) => {
                    e.preventDefault();
                    cell.classList.remove('drag-over');
                    const cardId = e.dataTransfer.getData('text/plain');
                    if (cardId) {
                        this.callbacks.onCardDropped({
                            cardId: cardId,
                            targetX: parseInt(x, 10),
                            targetY: parseInt(y, 10)
                        });
                    }
                });

                const entityData = boardData[y][x];
                if (entityData) {
                    const entityEl = document.createElement('div');
                    entityEl.classList.add('board-entity');
                    entityEl.classList.add(entityData.owner === 'HOST' ? 'entity-host' : 'entity-guest');
                    if (entityData.type === '君主') {
                        entityEl.classList.add('entity-king');
                    }
                    entityEl.textContent = entityData.type;
                    
                    cell.appendChild(entityEl);
                }

                this.boardElement.appendChild(cell);
            }
        }
    }

    /**
     * 更新手牌畫面
     * @param {Array} cards - 卡牌資料陣列
     * @param {boolean} isMyTurn - 當前是否為己方回合
     */
    renderHand(cards, isMyTurn = false) {
        this.handContainer.innerHTML = ''; 
        cards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.classList.add('card');
            
            // [Bug 修復] 必須同時滿足 CD 歸零與己方回合，才開放拖曳
            if (card.currentCD <= 0 && isMyTurn) {
                cardEl.draggable = true;
                cardEl.addEventListener('dragstart', (e) => {
                    cardEl.classList.add('dragging');
                    e.dataTransfer.setData('text/plain', card.id);
                });
                cardEl.addEventListener('dragend', () => {
                    cardEl.classList.remove('dragging');
                });
            } else {
                cardEl.draggable = false;
                // 若為 CD 中，加上反灰樣式 (非回合中的可用卡牌僅鎖定拖曳，不反灰)
                if (card.currentCD > 0) {
                    cardEl.classList.add('on-cooldown');
                }
            }

            const titleEl = document.createElement('div');
            titleEl.textContent = card.name;
            const cdEl = document.createElement('div');
            cdEl.textContent = card.currentCD > 0 ? `CD: ${card.currentCD}` : '可使用';

            cardEl.appendChild(titleEl);
            cardEl.appendChild(cdEl);
            this.handContainer.appendChild(cardEl);
        });
    }

    updateAP(currentAP, maxAP = 3) {
        this.apDisplay.textContent = `行動點數 (AP): ${currentAP} / ${maxAP}`;
    }

    updateTurnStatus(isMyTurn) {
        if (isMyTurn) {
            this.turnIndicator.textContent = '當前狀態：您的回合';
            this.turnIndicator.style.color = '#d32f2f';
            this.btnEndTurn.disabled = false;
        } else {
            this.turnIndicator.textContent = '當前狀態：對手回合';
            this.turnIndicator.style.color = '#555';
            this.btnEndTurn.disabled = true;
        }
    }
}
