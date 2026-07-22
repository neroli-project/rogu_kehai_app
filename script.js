// ==========================================================================
// 🚨 Firebaseの機能をインターネットから読み込む設定（スッキリ修正版！）
// ==========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
// 💡 update を追加してデータ安全更新ができるようにしたよ！
import { getDatabase, ref, set, update, onValue, child, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// ⚠️あなたの「秘密の鍵」
const firebaseConfig = {
    apiKey: "AIzaSyB39eq-VQP8fZNjVdm7BnO7gKEMBibqqDo",
    authDomain: "hana-kehai-app.firebaseapp.com",
    databaseURL: "https://hana-kehai-app-default-rtdb.firebaseio.com", 
    projectId: "hana-kehai-app",
    storageBucket: "hana-kehai-app.firebasestorage.app",
    messagingSenderId: "144341858428",
    appId: "1:144341858428:web:3adb2679fad549895171f9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ==========================================================================
// 🚨 URLからお部屋の名前と自分の名前を読み取る設定
// ==========================================================================
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room');
const myId = urlParams.get('myname');

// 💡部屋名か名前が空っぽなら、ログイン画面を表示して処理をストップする！
if (!roomId || !myId) {
    document.addEventListener('DOMContentLoaded', () => {
        const loginCon = document.getElementById('login-container');
        const appCon = document.getElementById('app-container');
        if (loginCon) loginCon.style.display = 'block';
        if (appCon) appCon.style.display = 'none';
    });
} else {
    // 部屋名と名前がある時だけ、いつものお部屋を表示する！
    document.addEventListener('DOMContentLoaded', () => {
        const loginCon = document.getElementById('login-container');
        const appCon = document.getElementById('app-container');
        if (loginCon) loginCon.style.display = 'none';
        if (appCon) appCon.style.display = 'block';
    });
}

// ==========================================================================
// 🔑 ログイン＆招待リンク生成の処理
// ==========================================================================
let generatedInviteUrl = "";
let nextJumpUrl = "";
let currentRoomName = ""; // 💡 入力されたお部屋の名前をキープしておく変数

// 💡 1つ目のボタン：入力内容をチェックして招待画面をポッと出す
window.loginToRoom = function() {
    const roomInput = document.getElementById('input-room').value.trim();
    const nameInput = document.getElementById('input-name').value.trim();
    
    if (!roomInput || !nameInput) {
        alert('お部屋の名前と、あなたの名前を入力してね！');
        return;
    }
    
    currentRoomName = roomInput;
    const baseUrl = window.location.origin + window.location.pathname;
    generatedInviteUrl = `${baseUrl}?room=${encodeURIComponent(roomInput)}`;
    nextJumpUrl = `${baseUrl}?room=${encodeURIComponent(roomInput)}&myname=${encodeURIComponent(nameInput)}`;
    
    document.getElementById('login-form-fields').style.display = 'none';
    document.getElementById('invite-area').style.display = 'block';
};

// 💡 招待メッセージをクリップボードに自動コピーする魔法
window.copyInviteMessage = function() {
    const message = `ふたりの「今の気配」がわかるアプリを作ってみたよ！🌸\n\n下のURLを開いて、ふたりの部屋名（${currentRoomName}）とあなたの好きなお名前を入れるだけで合流できるよ！待ってるね🥰👇\n${generatedInviteUrl}`;
    
    navigator.clipboard.writeText(message).then(() => {
        alert('📋 LINE用の招待メッセージをコピーしたよ！そのまま貼り付けて送ってね。');
    }).catch(err => {
        alert('コピーに失敗しちゃった。文字を直接選択してコピーしてね！');
    });
};

// 💡 2つ目のボタン：コピーした後に自分がお部屋に入る処理
window.goToRoomActual = function() {
    if (nextJumpUrl) {
        window.location.href = nextJumpUrl;
    }
};

// ==========================================================================
// 🔗 Firebaseデータベースへの接続設定
// ==========================================================================
let myRef, roomRef;
if (roomId && myId && typeof database !== "undefined") {
    myRef = ref(database, `rooms/${roomId}/users/${myId}`);
    roomRef = ref(database, `rooms/${roomId}/users`);
}

let uploadLimit = 100;

// ==========================================================================
// 🛠️ 共通で使う大事な関数
// ==========================================================================

// ✨ エフェクトを画面に出す魔法の関数
window.triggerEffect = function(emojis) {
    const effectLayer = document.getElementById('effect-layer');
    if (!effectLayer) return;
    
    const effectDiv = document.createElement('div');
    effectDiv.className = 'floating-effect';
    effectDiv.innerText = emojis;
    effectLayer.appendChild(effectDiv);
    setTimeout(() => { effectDiv.remove(); }, 2000);
};

// 💡 自分のメッセージだけを安全に保存する共通関数（写真全消去事故をガード！）
window.saveDataToServer = function(messageText, effectEmoji) {
    if (!myRef) return;
    
    const statusElement = document.getElementById('my-current-status');
    if (statusElement) {
        statusElement.innerText = messageText;
    }
    
    // update を使って写真を壊さずにメッセージだけ更新！
    update(myRef, {
        message: messageText,
        effect: effectEmoji || "",
        checked: false
    }).then(() => {
        console.log("Firebaseへの送信に成功！:", messageText);
    }).catch((error) => {
        console.error("Firebaseへの送信でエラー:", error);
    });
};

// ポップアップ開閉
window.openAvatarModal = function() { 
    if (typeof window.loadCustomAvatars === "function") {
        window.loadCustomAvatars();
    }
    const modal = document.getElementById('avatar-modal');
    if (modal) modal.style.display = 'flex'; 
};

window.closeAvatarModal = function() { 
    const modal = document.getElementById('avatar-modal');
    if (modal) modal.style.display = 'none'; 
};

// ==========================================================================
// 📡 部屋にいる「自分以外の人（相手）」＆「自分自身」のデータを自動で画面に映す
// ==========================================================================
if (roomRef) {
    onValue(roomRef, (snapshot) => {
        const allUsersData = snapshot.val();
        if (allUsersData) {
            // 👥 ① 相手のデータを画面に映す魔法
            const userNames = Object.keys(allUsersData);
            const partnerId = userNames.find(name => name !== myId);
            
            if (partnerId) {
                const partnerData = allUsersData[partnerId];
                
                const partnerTitle = document.querySelector('#partner-area h2');
                if (partnerTitle) partnerTitle.innerText = `${partnerId} のいま`;
                
                if (partnerData.avatar) {
                    document.getElementById('partner-avatar').src = partnerData.avatar;
                }
                if (partnerData.message) {
                    document.getElementById('partner-message').innerText = partnerData.message;
                }
                if (partnerData.effect && partnerData.checked === false) {
                    window.triggerEffect(partnerData.effect);
                    const currentRoomId = roomId || 'default_room';
                    // set ではなく update で安全にチェック済みに変更！
                    update(ref(database, `rooms/${currentRoomId}/users/${partnerId}`), { checked: true });
                }
            }

            // 🙋‍♀️ ② 自分のデータを画面に映す魔法（更新時のリセットを完全ガード！）
            if (myId && allUsersData[myId]) {
                const myData = allUsersData[myId];
                
                if (myData.avatar) {
                    const myPreview = document.getElementById('my-avatar-preview');
                    if (myPreview) myPreview.src = myData.avatar;
                }
                
                if (myData.message) {
                    const myStatus = document.getElementById('my-current-status');
                    if (myStatus) myStatus.innerText = myData.message;
                }
            }
        }
    });
}

// ==========================================================================
// 3. 状態ボタンを押した時の処理
// ==========================================================================
window.changeStatus = function(statusText) {
    let effect = "";
     if (statusText.includes('まったり')) effect = '☕️🍀🏠';
    else if (statusText.includes('勉強')) effect = '🔥💪😤';      
    else if (statusText.includes('パソコン')) effect = '💻👀⚡️';
    else if (statusText.includes('おやつ')) effect = '🍰🍩🧋';
    else if (statusText.includes('寝るね')) effect = '🌙💤⭐️';
    else if (statusText.includes('愛してる')) effect = '❤️❤️❤️';    
    else if (statusText.includes('大好き')) effect = '💖✨💘';  


    window.triggerEffect(effect);
    window.saveDataToServer(statusText, effect);
};

// ==========================================================================
// 4. 自由入力のメッセージ送信
// ==========================================================================
window.sendStatus = function() {
    const messageInput = document.getElementById('my-message-text');
    if (messageInput.value.trim() === "") {
        alert("メッセージを入力してね！");
        return;
    }
    const statusText = messageInput.value;
    const statusElement = document.getElementById('my-current-status');
    if (statusElement) statusElement.innerText = statusText;
    
    window.triggerEffect('✨🎉✨');
    window.saveDataToServer(statusText, '✨🎉✨');
    messageInput.value = "";
};

// ✨ アバターを選んだときの処理（メッセージを壊さず安全更新！）
window.selectPresetAvatar = function(presetId, customSrc) {
    const finalAvatarSrc = customSrc || `image/${presetId}.png`;
    
    const myPreview = document.getElementById('my-avatar-preview');
    if (myPreview) myPreview.src = finalAvatarSrc;
    
    if (typeof myRef !== "undefined" && myRef) {
        // 💡 set ではなく update でアバターのみを安全更新！
        update(myRef, { avatar: finalAvatarSrc })
            .then(() => console.log("アバター保存成功！:", finalAvatarSrc))
            .catch((error) => console.error("保存エラー:", error));
    }
};

// ==========================================================================
// 🔍 写真をタップした時に大きく拡大する魔法
// ==========================================================================
window.zoomPhoto = function(element) {
    const modal = document.getElementById('photo-zoom-modal');
    const zoomedImg = document.getElementById('zoomed-photo');
    if (modal && zoomedImg) {
        zoomedImg.src = element.src;
        modal.style.display = 'flex';
    }
};

window.closeZoomModal = function() {
    const modal = document.getElementById('photo-zoom-modal');
    if (modal) modal.style.display = 'none';
};

// ==========================================================================
// 📸 インスタ風画面切り替え（タブ機能）の魔法
// ==========================================================================
window.switchTab = function(tabName) {
    const myArea = document.getElementById('my-area');
    const partnerArea = document.getElementById('partner-area');
    const tabMyBtn = document.getElementById('tab-my');
    const tabPartnerBtn = document.getElementById('tab-partner');

    if (tabName === 'my') {
        if (myArea) myArea.style.display = 'block';
        if (partnerArea) partnerArea.style.display = 'none';
        if (tabMyBtn) {
            tabMyBtn.style.color = '#4caf50';
            tabMyBtn.style.borderBottom = '3px solid #4caf50';
        }
        if (tabPartnerBtn) {
            tabPartnerBtn.style.color = '#888';
            tabPartnerBtn.style.borderBottom = '3px solid transparent';
        }
    } else {
        if (myArea) myArea.style.display = 'none';
        if (partnerArea) partnerArea.style.display = 'block';
        if (tabPartnerBtn) {
            tabPartnerBtn.style.color = '#4caf50';
            tabPartnerBtn.style.borderBottom = '3px solid #4caf50';
        }
        if (tabMyBtn) {
            tabMyBtn.style.color = '#888';
            tabMyBtn.style.borderBottom = '3px solid transparent';
        }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    if (typeof window.switchTab === 'function') {
        window.switchTab('partner');
    }
});

// ==========================================================================
// 💡 アバター枠・文字カスタム・自分専用完全分離魔法！
// ==========================================================================

window.isEditMode = false;
window.currentEditingIndex = -1;

window.toggleCustomMode = function() {
    window.isEditMode = !window.isEditMode;
    const grid = document.getElementById('preset-avatar-grid');
    const button = document.getElementById('toggle-custom-mode');
    if (window.isEditMode) {
        if(grid) grid.classList.add('edit-mode');
        if(button) {
            button.innerText = "アバターを選ぶモードに戻る";
            button.style.backgroundColor = "#ff9800";
            button.style.boxShadow = "0 3px 0 #e68a00";
        }
    } else {
        if(grid) grid.classList.remove('edit-mode');
        if(button) {
            button.innerText = "⚙️ 6つの枠の写真をカスタムする";
            button.style.backgroundColor = "#888";
            button.style.boxShadow = "0 3px 0 #666";
        }
    }
};

window.handleAvatarClick = function(index, presetId) {
    if (window.isEditMode) {
        window.currentEditingIndex = index;
        const fileInput = document.getElementById('avatar-file-input');
        if (fileInput) fileInput.click(); 
    } else {
        const img = document.getElementById(`preset-img-${index}`);
        const customSrc = img ? img.src : null;
        window.selectPresetAvatar(presetId, customSrc);
        if (typeof window.closeAvatarModal === "function") window.closeAvatarModal();
    }
};

// 🖼️ 画質を綺麗に保ちつつ容量オーバーを防ぐ画像圧縮魔法！
function compressImage(file, maxWidth, maxHeight, callback) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            if (width > height) {
                if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
            } else {
                if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
            }
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            // 💡 綺麗で軽い絶妙な画質（0.85）に調整！
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            callback(compressedDataUrl);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// 📸 自分の写真をセットする魔法（重複を消して一本化！）
window.uploadOwnPhoto = function(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        // 💡 くっきり綺麗な200x200サイズで圧縮！
        compressImage(file, 200, 200, function(compressedDataUrl) {
            if (window.isEditMode && window.currentEditingIndex !== -1) {
                const index = window.currentEditingIndex;
                const urlParams = new URLSearchParams(window.location.search);
                const roomName = urlParams.get('room') || 'default_room';
                const userName = urlParams.get('myname') || 'default_user';
                
                if (typeof database !== "undefined" && database) {
                    const customAvatarRef = ref(database, `rooms/${roomName}/users/${userName}/custom_avatars/custom_${index}`);
                    set(customAvatarRef, compressedDataUrl).then(() => {
                        alert(`${index}番目の枠をあなた専用に完全保存しました！`);
                        window.toggleCustomMode();
                        window.currentEditingIndex = -1;
                    }).catch((error) => console.error("保存エラー:", error));
                }
            } else {
                const myPreview = document.getElementById('my-avatar-preview');
                if (myPreview) myPreview.src = compressedDataUrl;
                
                if (typeof myRef !== "undefined" && myRef) {
                    // update で写真を安全保存！
                    update(myRef, { avatar: compressedDataUrl })
                        .then(() => {
                            console.log("写真の安全更新完了！");
                            window.closeAvatarModal();
                        })
                        .catch((error) => {
                            console.error("保存エラー:", error);
                            window.closeAvatarModal();
                        });
                } else {
                    window.closeAvatarModal();
                }
            }
        });
    }
};

window.loadCustomAvatars = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomName = urlParams.get('room') || 'default_room';
    const userName = urlParams.get('myname') || 'default_user';
    
    if (typeof database !== "undefined" && database) {
        const customAvatarsRef = ref(database, `rooms/${roomName}/users/${userName}/custom_avatars`);
        onValue(customAvatarsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                for (let i = 1; i <= 6; i++) {
                    if (data[`custom_${i}`]) {
                        const presetImg = document.getElementById(`preset-img-${i}`);
                        if (presetImg) presetImg.src = data[`custom_${i}`];
                    }
                }
            }
        });
    }
};

// --- ⚙️ 文字カスタム用の設定群 ---
window.isTextEditMode = false;

window.toggleTextCustomMode = function() {
    window.isTextEditMode = !window.isTextEditMode;
    const button = document.getElementById('toggle-text-custom-mode');
    if (window.isTextEditMode) {
        if(button) {
            button.innerText = "文字を選ぶモードに戻る";
            button.style.backgroundColor = "#9c27b0";
            button.style.boxShadow = "0 3px 0 #7b1fa2";
        }
        alert("文字のカスタムモードになりました！変更したいボタンをポチッと押してね。");
    } else {
        if(button) {
            button.innerText = "⚙️ 7つの文字をカスタムする";
            button.style.backgroundColor = "#888";
            button.style.boxShadow = "0 3px 0 #666";
        }
    }
};


window.handleTextClick = function(index, defaultText) {
    const urlParams = new URLSearchParams(window.location.search);
    const roomName = urlParams.get('room') || 'default_room';
    const userName = urlParams.get('myname') || 'default_user';

    if (window.isTextEditMode) {
        const currentBtn = document.getElementById(`status-btn-${index}`);
        const currentText = currentBtn ? currentBtn.innerText : defaultText;
        const newText = prompt(`【${index + 1}番目のボタン】新しい文字を入力してね：`, currentText);
        
        if (newText !== null && newText.trim() !== "") {
            if (typeof database !== "undefined" && database) {
                // 文字も自分専用のフォルダに保存！
                const textRef = ref(database, `rooms/${roomName}/users/${userName}/custom_texts/text_${index}`);
                set(textRef, newText).then(() => {
                    alert(`ボタンの文字を「${newText}」に完全保存しました！`);
                    // 💡 画面上のボタンの文字も即座に書き換え！
                    if (currentBtn) currentBtn.innerText = newText;
                    window.toggleTextCustomMode();
                }).catch((error) => { console.error("文字保存エラー:", error); });
            }
        }
    } else {
        const currentBtn = document.getElementById(`status-btn-${index}`);
        const selectedText = currentBtn ? currentBtn.innerText : defaultText;
        
        // 💡 エフェクト判定＆送信関数を呼び出す魔法！
        if (typeof window.changeStatus === "function") {
            window.changeStatus(selectedText);
        } else if (typeof saveDataToServer === "function") {
            saveDataToServer(selectedText, "");
        }
    }
};

window.loadCustomTexts = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomName = urlParams.get('room') || 'default_room';
    const userName = urlParams.get('myname') || 'default_user';
    
    if (typeof database !== "undefined" && database) {
        const customTextsRef = ref(database, `rooms/${roomName}/users/${userName}/custom_texts`);
        onValue(customTextsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                for (let i = 0; i < 7; i++) {
                    if (data[`text_${i}`]) {
                        const btn = document.getElementById(`status-btn-${i}`);
                        if (btn) btn.innerText = data[`text_${i}`];
                    }
                }
            }
        });
    }
};

window.loadMyPrivateDataOnce = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomName = urlParams.get('room') || 'default_room';
    const userName = urlParams.get('myname') || 'default_user';
    
    if (typeof database !== "undefined" && database) {
        const myPrivateRef = ref(database, `rooms/${roomName}/users/${userName}`);
        get(myPrivateRef).then((snapshot) => {
            const data = snapshot.val();
            if (data) {
                if (data.avatar) {
                    const myPreview = document.getElementById('my-avatar-preview');
                    if (myPreview) myPreview.src = data.avatar;
                }
                if (data.message) {
                    const myStatus = document.getElementById('my-current-status');
                    if (myStatus) myStatus.innerText = data.message;
                }
            }
        });
    }
};

// 🎬 画面起動時にすべてを自動で読み込む
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        if (typeof window.loadCustomAvatars === "function") window.loadCustomAvatars();
        if (typeof window.loadCustomTexts === "function") window.loadCustomTexts();
        if (typeof window.loadMyPrivateDataOnce === "function") window.loadMyPrivateDataOnce();
    }, 1000);
});