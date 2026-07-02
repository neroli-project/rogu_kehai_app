// ==========================================================================
// 🚨 Firebaseの機能をインターネットから読み込む設定（childを追加したよ！）
// ==========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, child } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";// ⚠️あなたの「秘密の鍵」
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
        document.getElementById('login-container').style.display = 'block';
        document.getElementById('app-container').style.display = 'none';
    });
} else {
    // 部屋名と名前がある時だけ、いつものお部屋を表示する！
    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
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
    
    // 💡 入力された部屋名を後で使うために覚えさせておくよ！
    currentRoomName = roomInput;
    
    // 相手に送る用のベースURLを自動で作るよ
    const baseUrl = window.location.origin + window.location.pathname;
    generatedInviteUrl = `${baseUrl}?room=${encodeURIComponent(roomInput)}`;
    
    // 自分が後で入る用のURLもキープしておくよ
    nextJumpUrl = `${baseUrl}?room=${encodeURIComponent(roomInput)}&myname=${encodeURIComponent(nameInput)}`;
    
    // 入力欄を隠して、招待コピー画面をポッと出す！
    document.getElementById('login-form-fields').style.display = 'none';
    document.getElementById('invite-area').style.display = 'block';
}

// 💡 招待メッセージをクリップボードに自動コピーする魔法
window.copyInviteMessage = function() {
    // 👇 ここがポイント！ 「〇〇〇」だった部分に、自動で実際の部屋名が入るよ！
    const message = `ふたりの「今の気配」がわかるアプリを作ってみたよ！🌸\n\n下のURLを開いて、ふたりの部屋名（${currentRoomName}）とあなたの好きなお名前を入れるだけで合流できるよ！待ってるね🥰👇\n${generatedInviteUrl}`;
    
    navigator.clipboard.writeText(message).then(() => {
        alert('📋 LINE用の招待メッセージをコピーしたよ！そのまま貼り付けて送ってね。'); // 「送ね」のタイポも直しておいたよ！
    }).catch(err => {
        alert('コピーに失敗しちゃった。文字を直接選択してコピーしてね！');
    });
}

// 💡 2つ目のボタン：コピーした後に自分がお部屋に入る処理
window.goToRoomActual = function() {
    if (nextJumpUrl) {
        window.location.href = nextJumpUrl;
    }
}

// ==========================================================================
// 🔗 Firebaseデータベースへの接続設定（部屋情報があるときだけ動くようにするよ）
// ==========================================================================
let myRef, roomRef;
if (roomId && myId) {
    myRef = ref(database, `rooms/${roomId}/users/${myId}`);
    roomRef = ref(database, `rooms/${roomId}/users`);
}

let uploadLimit = 3;

// ==========================================================================
// 🛠️ 共通で使う大事な関数
// ==========================================================================

// 自分のデータをFirebaseに送信（保存）する共通関数
window.saveDataToServer = function(messageText, effectEmoji) {
    if (!myRef) return;
    const currentAvatarSrc = document.getElementById('my-avatar-preview').src;
    
    const statusElement = document.getElementById('my-current-status');
    if (statusElement) {
        statusElement.innerText = messageText;
    }
    
    set(myRef, {
        avatar: currentAvatarSrc,
        message: messageText,
        effect: effectEmoji || "",
        checked: false
    }).then(() => {
        console.log("Firebaseへの送信に成功！:", messageText);
    }).catch((error) => {
        console.error("Firebaseへの送信でエラー:", error);
    });
}

// ==========================================================================
// 🛠️ 共通で使う大事な関数（確実に外から見えるように修正したよ！）
// ==========================================================================

// ✨ エフェクトを画面に出す魔法の関数（windowを頭につけました！）
window.triggerEffect = function(emojis) {
    const effectLayer = document.getElementById('effect-layer');
    if (!effectLayer) return;
    
    const effectDiv = document.createElement('div');
    effectDiv.className = 'floating-effect';
    effectDiv.innerText = emojis;
    effectLayer.appendChild(effectDiv);
    setTimeout(() => { effectDiv.remove(); }, 2000);
}

// 自分のデータをFirebaseに送信（保存）する共通関数
window.saveDataToServer = function(messageText, effectEmoji) {
    if (!myRef) return;
    const currentAvatarSrc = document.getElementById('my-avatar-preview').src;
    
    const statusElement = document.getElementById('my-current-status');
    if (statusElement) {
        statusElement.innerText = messageText;
    }
    
    set(myRef, {
        avatar: currentAvatarSrc,
        message: messageText,
        effect: effectEmoji || "",
        checked: false
    }).then(() => {
        console.log("Firebaseへの送信に成功！:", messageText);
    }).catch((error) => {
        console.error("Firebaseへの送信でエラー:", error);
    });
}

// ポップアップ開閉（開く瞬間にカスタム写真を強制リロードする魔法を追加！）
window.openAvatarModal = function() { 
    // 💡 ポップアップを開く前に、過去にカスタムした写真をLocalStorageから確実に読み込む！
    if (typeof window.loadCustomAvatars === "function") {
        window.loadCustomAvatars();
    }
    
    // ポップアップを表示する
    document.getElementById('avatar-modal').style.display = 'flex'; 
}

window.closeAvatarModal = function() { 
    document.getElementById('avatar-modal').style.display = 'none'; 
}
// ==========================================================================
// 📡 部屋にいる「自分以外の人（相手）」＆「自分自身」のデータを自動で画面に映す
// ==========================================================================
if (roomRef) {
    onValue(roomRef, (snapshot) => {
        const allUsersData = snapshot.val();
        if (allUsersData) {
            // --------------------------------------------------
            // 👥 ① 相手のデータを画面に映す魔法
            // --------------------------------------------------
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
                    const urlParams = new URLSearchParams(window.location.search);
                    const roomId = urlParams.get('room') || 'default_room';
                    set(ref(database, `rooms/${roomId}/users/${partnerId}/checked`), true);
                }
            }

            // --------------------------------------------------
            // 🙋‍♀️ ② 自分のデータを画面に映す魔法（更新時のリセットを完全ガード！）
            // --------------------------------------------------
            if (myId && allUsersData[myId]) {
                const myData = allUsersData[myId];
                
                // Firebaseに保存されている自分のアバターを、開いた瞬間に強制的にプレビューに映す！
                if (myData.avatar) {
                    const myPreview = document.getElementById('my-avatar-preview');
                    if (myPreview) {
                        myPreview.src = myData.avatar;
                    }
                }
                
                // ついでに自分のメッセージもリセットされないように守るよ！
                if (myData.message) {
                    const myStatus = document.getElementById('my-current-status');
                    if (myStatus) {
                        myStatus.innerText = myData.message;
                    }
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

    // 👇 頭に window. を付け足して、確実に魔法を呼び出すよ！
    window.triggerEffect(effect);
    window.saveDataToServer(statusText, effect);
}
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
    document.getElementById('my-current-status').innerText = statusText;
    
    // 👇 ここも頭に window. を付け足すよ！
    window.triggerEffect('✨🎉✨');
    window.saveDataToServer(statusText, '✨🎉✨');
    messageInput.value = "";
}
// ✨ アバターを選んだときの処理（スマホでのリセット完全ガード版！）
window.selectPresetAvatar = function(presetId, customSrc) {
    // もしカスタムされた画像URLがあればそれを使い、なければ元の画像パスを使う
    const finalAvatarSrc = customSrc || `image/${presetId}.png`;
    
    // 1. 自分のプレビュー画像を書き換える
    const myPreview = document.getElementById('my-avatar-preview');
    if (myPreview) {
        myPreview.src = finalAvatarSrc;
    }
    
    // 2. サーバー（Firebase）に直接「新しい画像」を指定して確実に保存する！
    const currentMsg = "アバターを変えたよ";
    
    if (typeof myRef !== "undefined" && myRef && typeof set === "function") {
        // 💡 時差をなくすために、画面のプレビューを待たずに「決定した画像URL」を直接Firebaseに送りつけるよ！
        set(myRef, {
            avatar: finalAvatarSrc, // 新しい画像を確実に指定！
            message: currentMsg,
            effect: "",
            checked: false
        }).then(() => {
            console.log("アバターのFirebase保存に成功！:", finalAvatarSrc);
        }).catch((error) => {
            console.error("アバターのFirebase保存エラー:", error);
        });
    } else {
        // バックアップ用（もし上の直接保存が動かない場合は元の関数を呼ぶ）
        if (typeof saveDataToServer === "function") {
            saveDataToServer(currentMsg, "");
        } else if (typeof window.saveDataToServer === "function") {
            window.saveDataToServer(currentMsg, "");
        }
    }
}
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
}

window.closeZoomModal = function() {
    const modal = document.getElementById('photo-zoom-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

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
}

// アプリを開いた瞬間に、自動で「あいて」のタブを最初に選んでおく魔法
window.addEventListener('DOMContentLoaded', () => {
    if (typeof window.switchTab === 'function') {
        window.switchTab('partner');
    }
});

// ==========================================================================
// 📸 【復活！】自分の写真を読み込んでセットする魔法
// ==========================================================================
window.uploadOwnPhoto = function(input) {
    if (!checkUploadLimit()) {
        alert("本日の変更回数の上限です");
        return;
    }

    // 写真がちゃんと選ばれているかチェック
    if (input.files && input.files[0]) {
        const reader = new FileReader();

        // 写真の読み込みが完了した時の処理
        reader.onload = function(e) {
            // 自分のアバタープレビューを、選んだ写真に書き換える
            document.getElementById('my-avatar-preview').src = e.target.result;

            // Firebaseのサーバーにも、この写真のデータを送信する
            const currentMsg = "新しい写真を設定したよ！📸";
            window.saveDataToServer(currentMsg, "");

            // 制限回数を減らしてモーダルを閉じる
            reduceUploadCount();
            window.closeAvatarModal();
        };

        // 写真をデータとして読み込む
        reader.readAsDataURL(input.files[0]);
    }
}



// ==========================================================================
// 💡 【10.8.0対応】アバター枠のカスタム＆文字カスタム 究極合体版魔法！
// ==========================================================================

// --- ⚙️ アバター用の設定群 ---
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
        if (typeof checkUploadLimit === "function" && !checkUploadLimit()) {
            alert("本日の変更回数の上限（3回）に達したため、変更できません。");
            return;
        }
        const img = document.getElementById(`preset-img-${index}`);
        const customSrc = img ? img.src : null;
        window.selectPresetAvatar(presetId, customSrc);
        if (typeof reduceUploadCount === "function") reduceUploadCount();
        if (typeof window.closeAvatarModal === "function") window.closeAvatarModal();
    }
};

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
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
            callback(compressedDataUrl);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

window.uploadOwnPhoto = function(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        compressImage(file, 150, 150, function(compressedDataUrl) {
            if (window.isEditMode && window.currentEditingIndex !== -1) {
                const index = window.currentEditingIndex;
                const urlParams = new URLSearchParams(window.location.search);
                const roomName = urlParams.get('room') || 'default_room';
                if (typeof database !== "undefined" && database) {
                    const customAvatarRef = ref(database, `rooms/${roomName}/custom_avatars/custom_${index}`);
                    set(customAvatarRef, compressedDataUrl).then(() => {
                        alert(`${index}番目の枠を保存しました！`);
                        window.toggleCustomMode();
                        window.currentEditingIndex = -1;
                    }).catch((error) => { console.error("保存エラー:", error); });
                }
            } else {
                if (typeof checkUploadLimit === "function" && !checkUploadLimit()) { alert("本日の変更回数の上限です"); return; }
                const myPreview = document.getElementById('my-avatar-preview');
                if (myPreview) myPreview.src = compressedDataUrl;
                if (typeof saveDataToServer === "function") { saveDataToServer("新しい写真を設定したよ！📸", ""); }
                if (typeof reduceUploadCount === "function") reduceUploadCount();
                window.closeAvatarModal();
            }
        });
    }
};

window.loadCustomAvatars = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomName = urlParams.get('room') || 'default_room';
    if (typeof database !== "undefined" && database) {
        const customAvatarsRef = ref(database, `rooms/${roomName}/custom_avatars`);
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


// --- ⚙️ 文字カスタム用の設定群（7つ対応版！） ---
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

    if (window.isTextEditMode) {
        const currentBtn = document.getElementById(`status-btn-${index}`);
        const currentText = currentBtn ? currentBtn.innerText : defaultText;
        const newText = prompt(`【${index + 1}番目のボタン】新しい文字を入力してね：`, currentText);
        
        if (newText !== null && newText.trim() !== "") {
            if (typeof database !== "undefined" && database) {
                const textRef = ref(database, `rooms/${roomName}/custom_texts/text_${index}`);
                set(textRef, newText).then(() => {
                    alert(`ボタンの文字を「${newText}」に保存しました！`);
                    window.toggleTextCustomMode();
                }).catch((error) => { console.error("文字保存エラー:", error); });
            }
        }
    } else {
        // 通常モードの時は元の changeStatus のようにメッセージを送信！
        const currentBtn = document.getElementById(`status-btn-${index}`);
        const selectedText = currentBtn ? currentBtn.innerText : defaultText;
        if (typeof saveDataToServer === "function") {
            saveDataToServer(selectedText, "");
        }
    }
};

window.loadCustomTexts = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomName = urlParams.get('room') || 'default_room';
    if (typeof database !== "undefined" && database) {
        const customTextsRef = ref(database, `rooms/${roomName}/custom_texts`);
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

// 🎬 画面起動時にすべてを自動で読み込む
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        if (typeof window.loadCustomAvatars === "function") window.loadCustomAvatars();
        if (typeof window.loadCustomTexts === "function") window.loadCustomTexts();
    }, 1000);
});