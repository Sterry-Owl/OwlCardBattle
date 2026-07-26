import { NetworkManager } from './network.js';
import { UIManager } from './ui.js';
import { GameEngine } from './game.js';

/**
 * 系統初始化與事件綁定
 * 確保 HTML DOM 完全載入後才執行程式
 */
document.addEventListener('DOMContentLoaded', () => {
    // 取得連線大廳與遊戲介面的 DOM 節點
    const btnCreateRoom = document.getElementById('btn-create-room');
    const btnJoinRoom = document.getElementById('btn-join-room');
    const inputRoomId = document.getElementById('input-room-id');
    const roomIdDisplay = document.getElementById('room-id-display');
    const connectionStatus = document.getElementById('connection-status');
    const lobbyContainer = document.getElementById('lobby-container');
    const gameContainer = document.getElementById('game-container');
    
    let isHost = false; // 記錄本地玩家是否為房主

    // 初始化遊戲狀態機
    const gameEngine = new GameEngine();

    // 初始化 UI 模組
    const uiManager = new UIManager(
        {
            board: document.getElementById('board'),
            hand: document.getElementById('hand-container'),
            apDisplay: document.getElementById('ap-display')
        },
        {
            onCardDropped: (data) => {
                // 向 GameEngine 驗證出牌規則
                const result = gameEngine.playCard(data.cardId, data.targetX, data.targetY);
                
                if (result.success) {
                    // 更新本地端畫面
                    uiManager.renderHand(result.updatedHand);
                    uiManager.updateAP(result.currentAP, gameEngine.maxAP);
                    // 註：此處尚未實作單一網格的渲染更新，後續需在 UIManager 擴充
                    
                    // 將合法操作傳送給對手以同步狀態
                    networkManager.sendData({
                        action: 'PLAY_CARD',
                        cardId: data.cardId,
                        targetX: data.targetX,
                        targetY: data.targetY
                    });
                } else {
                    console.warn('出牌失敗:', result.reason);
                }
            },
            onCellClicked: (data) => {
                console.log('使用者點擊棋盤網格:', data);
                // 預留：在此處處理棋子選取與移動/攻擊邏輯
            }
        }
    );

    // 初始化網路模組
    const networkManager = new NetworkManager({
        onReady: (id) => {
            roomIdDisplay.textContent = id;
            connectionStatus.textContent = '系統狀態：等待對手加入...';
        },
        onConnected: () => {
            connectionStatus.textContent = '系統狀態：連線成功！遊戲即將開始...';
            
            lobbyContainer.style.display = 'none';
            gameContainer.style.display = 'block';
            
            // 啟動遊戲核心邏輯
            gameEngine.initGame(isHost);
            const initialState = gameEngine.getState();
            
            // 依據底層資料渲染初始畫面
            uiManager.renderBoard();
            uiManager.renderHand(initialState.hand);
            uiManager.updateAP(initialState.ap, initialState.maxAP);
        },
        onDataReceived: (data) => {
            console.log('接收到同步指令:', data);
            
            // 處理對方傳送過來的指令
            if (data.action === 'PLAY_CARD') {
                // 預留：將對手的指令套用至本地 GameEngine 與 UI
                console.log(`對手將卡牌放置於 [${data.targetX}, ${data.targetY}]`);
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
