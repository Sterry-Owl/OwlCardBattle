import { NetworkManager } from './network.js';
import { UIManager } from './ui.js';
import { GameEngine } from './game.js';

document.addEventListener('DOMContentLoaded', () => {
    const btnCreateRoom = document.getElementById('btn-create-room');
    const btnJoinRoom = document.getElementById('btn-join-room');
    const inputRoomId = document.getElementById('input-room-id');
    const roomIdDisplay = document.getElementById('room-id-display');
    const connectionStatus = document.getElementById('connection-status');
    const lobbyContainer = document.getElementById('lobby-container');
    const gameContainer = document.getElementById('game-container');
    const deckCountDisplay = document.getElementById('deck-count');
    
    let isHost = false; 

    const gameEngine = new GameEngine();

    const uiManager = new UIManager(
        {
            board: document.getElementById('board'),
            hand: document.getElementById('hand-container'),
            apDisplay: document.getElementById('ap-display'),
            btnEndTurn: document.getElementById('btn-end-turn'),
            turnIndicator: document.getElementById('turn-indicator')
        },
        {
            // 玩家拖曳出牌事件
            onCardDropped: (data) => {
                const result = gameEngine.playCard(data.cardId, data.targetX, data.targetY);
                
                if (result.success) {
                    const currentState = gameEngine.getState();
                    uiManager.renderHand(currentState.hand);
                    uiManager.updateAP(currentState.ap, currentState.maxAP);
                    uiManager.renderBoard(currentState.board); // 重新渲染棋盤畫出士兵
                    
                    // 傳送指令給對手，包含打出的卡牌名稱 (供對方渲染)
                    networkManager.sendData({
                        action: 'PLAY_CARD',
                        cardId: data.cardId,
                        cardType: result.playedCard.name, 
                        targetX: data.targetX,
                        targetY: data.targetY
                    });
                } else {
                    console.warn('出牌失敗:', result.reason);
                }
            },
            onCellClicked: (data) => {
                console.log('使用者點擊棋盤網格:', data);
            },
            // 玩家點擊結束回合事件
            onEndTurnClicked: () => {
                const state = gameEngine.endTurn();
                uiManager.updateTurnStatus(state.isMyTurn);
                
                networkManager.sendData({
                    action: 'END_TURN'
                });
            }
        }
    );

    const networkManager = new NetworkManager({
        onReady: (id) => {
            roomIdDisplay.textContent = id;
            connectionStatus.textContent = '系統狀態：等待對手加入...';
        },
        onConnected: () => {
            connectionStatus.textContent = '系統狀態：連線成功！遊戲即將開始...';
            
            lobbyContainer.style.display = 'none';
            gameContainer.style.display = 'block';
            
            // 模擬外部構築好的 20 張牌組
            const myDeck = [];
            for (let i = 1; i <= 15; i++) {
                myDeck.push({ id: `soldier_${i}`, name: '步兵', type: 'SOLDIER', currentCD: 1 });
            }
            for (let i = 1; i <= 5; i++) {
                myDeck.push({ id: `skill_${i}`, name: '戰術衝鋒', type: 'SKILL', currentCD: 2 });
            }

            // 啟動遊戲
            gameEngine.initGame(isHost, myDeck);
            const initialState = gameEngine.getState();
            
            // 渲染初始畫面
            uiManager.renderBoard(initialState.board);
            uiManager.renderHand(initialState.hand);
            uiManager.updateAP(initialState.ap, initialState.maxAP);
            uiManager.updateTurnStatus(initialState.isMyTurn);
            
            if (deckCountDisplay) deckCountDisplay.textContent = initialState.deckCount;
        },
        // 接收對手網路指令
        onDataReceived: (data) => {
            console.log('接收到同步指令:', data);
            
            if (data.action === 'PLAY_CARD') {
                // 對手出牌：更新本地棋盤陣列並重繪畫面
                gameEngine.syncOpponentPlay(data.targetX, data.targetY, data.cardType);
                uiManager.renderBoard(gameEngine.getState().board);
            } 
            else if (data.action === 'END_TURN') {
                // 對手結束回合：本地端開始回合
                const state = gameEngine.startTurn();
                uiManager.updateTurnStatus(state.isMyTurn);
                uiManager.updateAP(state.ap, state.maxAP);
                uiManager.renderHand(state.hand); // 更新手牌 CD 減少與新抽的卡
                if (deckCountDisplay) deckCountDisplay.textContent = state.deckCount;
            }
        },
        onError: (err) => {
            connectionStatus.textContent = `系統狀態：發生錯誤 (${err.message})`;
            console.error('連線模組錯誤:', err);
            btnCreateRoom.disabled = false;
            btnJoinRoom.disabled = false;
        }
    });

    btnCreateRoom.addEventListener('click', () => {
        isHost = true;
        btnCreateRoom.disabled = true;
        btnJoinRoom.disabled = true;
        connectionStatus.textContent = '系統狀態：正在建立房間...';
        networkManager.initializeHost();
    });

    btnJoinRoom.addEventListener('click', () => {
        isHost = false;
        const hostId = inputRoomId.value.trim();
        if (!hostId) {
            alert('請輸入有效的房間代碼');
            return;
        }
        btnCreateRoom.disabled = true;
        btnJoinRoom.disabled = true;
        connectionStatus.textContent = '系統狀態：正在連線至房間...';
        networkManager.connectToHost(hostId);
    });
});
