// Telegram Bot API Base URL
const TELEGRAM_API = 'https://api.telegram.org/bot';

// Global variables
let currentChatId = '';
let contacts = [];

// Utility functions
function showOutput(data) {
    const output = document.getElementById('output');
    output.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
}

function getToken() {
    const token = document.getElementById('botToken').value.trim();
    if (!token) {
        alert('Masukkan token bot terlebih dahulu!');
        return null;
    }
    return token;
}

function getSelectedGroup() {
    const select = document.getElementById('groupSelect');
    currentChatId = select.value;
    return currentChatId;
}

function hideAllInputs() {
    const inputs = ['messageInput', 'photoInput', 'groupNameInput', 'descriptionInput', 'photoUpload', 'usernameInput', 'contactMessageInput', 'botPhotoUpload', 'botNameInput'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.classList.add('hidden');
    });
}

// Input display functions
function showMessageInput() {
    hideAllInputs();
    document.getElementById('messageInput').classList.remove('hidden');
}

function showPhotoInput() {
    hideAllInputs();
    document.getElementById('photoInput').classList.remove('hidden');
}

function showGroupNameInput() {
    hideAllInputs();
    document.getElementById('groupNameInput').classList.remove('hidden');
}

function showDescriptionInput() {
    hideAllInputs();
    document.getElementById('descriptionInput').classList.remove('hidden');
}

function showPhotoUpload() {
    hideAllInputs();
    document.getElementById('photoUpload').classList.remove('hidden');
}

function showUsernameInput() {
    hideAllInputs();
    document.getElementById('usernameInput').classList.remove('hidden');
}

function showContactMessageInput() {
    hideAllInputs();
    document.getElementById('contactMessageInput').classList.remove('hidden');
}

function showBotPhotoUpload() {
    hideAllInputs();
    document.getElementById('botPhotoUpload').classList.remove('hidden');
}

function showBotNameInput() {
    hideAllInputs();
    document.getElementById('botNameInput').classList.remove('hidden');
}

// Telegram API Call Function
async function callTelegramAPI(token, method, params = {}) {
    const url = `${TELEGRAM_API}${token}/${method}`;
    
    try {
        // Convert params to URLSearchParams for GET requests
        const queryParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                queryParams.append(key, params[key]);
            }
        });

        const response = await fetch(`${url}?${queryParams}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Call Error:', error);
        throw error;
    }
}

// POST request untuk upload file
async function callTelegramAPIPost(token, method, formData) {
    const url = `${TELEGRAM_API}${token}/${method}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API POST Call Error:', error);
        throw error;
    }
}

// Error handler dengan info support
function handleError(error, customMessage = '') {
    console.error('Error:', error);
    
    const errorMessage = customMessage || error.message || 'Terjadi kesalahan tidak terduga';
    
    showOutput({
        success: false,
        error: errorMessage,
        support_info: 'Jika error berlanjut, hubungi support: @MikuHost di Telegram',
        raw_error: error.toString()
    });
}

// Bot Actions
async function checkBotName() {
    const token = getToken();
    if (!token) return;

    try {
        showOutput('🔄 Memeriksa nama bot...');
        const result = await callTelegramAPI(token, 'getMe');
        
        if (result.ok) {
            const bot = result.result;
            
            // Dapatkan info foto profil bot
            let profilePhotoInfo = 'Tidak ada foto profil';
            try {
                const photosResult = await callTelegramAPI(token, 'getUserProfilePhotos', {
                    user_id: bot.id,
                    limit: 1
                });
                
                if (photosResult.ok && photosResult.result.photos.length > 0) {
                    const photo = photosResult.result.photos[0];
                    profilePhotoInfo = `Ada ${photosResult.result.total_count} foto profil`;
                }
            } catch (photoError) {
                profilePhotoInfo = 'Tidak dapat mengambil info foto';
            }
            
            showOutput({
                success: true,
                botName: `${bot.first_name} (@${bot.username})`,
                id: bot.id,
                canJoinGroups: bot.can_join_groups,
                canReadMessages: bot.can_read_all_group_messages,
                profilePhoto: profilePhotoInfo,
                support: 'Butuh bantuan? Hubungi @MikuHost di Telegram',
                raw: result
            });
        } else {
            showOutput({
                success: false,
                error: result.description,
                support: 'Cek token bot atau hubungi @MikuHost di Telegram'
            });
        }
    } catch (error) {
        handleError(error, 'Gagal terhubung ke Telegram API. Periksa token dan koneksi internet.');
    }
}

async function discoverGroups() {
    const token = getToken();
    if (!token) return;

    try {
        showOutput('🔄 Mencari grup...');
        const result = await callTelegramAPI(token, 'getUpdates', { 
            offset: -1,
            limit: 100,
            timeout: 1
        });

        if (result.ok) {
            const groups = [];
            const seenChats = new Set();

            result.result.forEach(update => {
                let chat = null;
                
                if (update.message && update.message.chat) {
                    chat = update.message.chat;
                } else if (update.my_chat_member && update.my_chat_member.chat) {
                    chat = update.my_chat_member.chat;
                } else if (update.channel_post && update.channel_post.chat) {
                    chat = update.channel_post.chat;
                }

                if (chat && (chat.type === 'group' || chat.type === 'supergroup') && !seenChats.has(chat.id)) {
                    seenChats.add(chat.id);
                    groups.push({
                        id: chat.id,
                        title: chat.title || 'Unknown',
                        type: chat.type,
                        username: chat.username || 'No username'
                    });
                }
            });

            // Update dropdown
            const select = document.getElementById('groupSelect');
            select.innerHTML = '<option value="">-- Pilih grup --</option>';
            
            groups.forEach(group => {
                const option = document.createElement('option');
                option.value = group.id;
                option.textContent = `${group.title} (${group.type})`;
                select.appendChild(option);
            });

            showOutput({
                success: true,
                groupsFound: groups.length,
                groups: groups,
                support: 'Bot tidak menemukan grup? Pastikan bot sudah dijadikan admin di grup tersebut',
                raw: result
            });
        } else {
            showOutput({
                success: false,
                error: result.description,
                support: 'Hubungi @MikuHost di Telegram untuk bantuan'
            });
        }
    } catch (error) {
        handleError(error, 'Gagal mengambil data grup');
    }
}

// Fitur baru: Cek Kontak
async function checkContacts() {
    const token = getToken();
    if (!token) return;

    try {
        showOutput('🔄 Mencari kontak yang pernah chat dengan bot...');
        const result = await callTelegramAPI(token, 'getUpdates', { 
            offset: -1,
            limit: 100,
            timeout: 1
        });

        if (result.ok) {
            contacts = [];
            const seenUsers = new Set();

            result.result.forEach(update => {
                let user = null;
                
                if (update.message && update.message.from) {
                    user = update.message.from;
                } else if (update.my_chat_member && update.my_chat_member.from) {
                    user = update.my_chat_member.from;
                }

                if (user && !seenUsers.has(user.id)) {
                    seenUsers.add(user.id);
                    contacts.push({
                        id: user.id,
                        firstName: user.first_name || '',
                        lastName: user.last_name || '',
                        username: user.username || 'No username',
                        isBot: user.is_bot
                    });
                }
            });

            // Update contacts dropdown
            const select = document.getElementById('contactSelect');
            select.innerHTML = '<option value="">-- Pilih kontak --</option>';
            
            contacts.forEach(contact => {
                const option = document.createElement('option');
                option.value = contact.id;
                const displayName = `${contact.firstName} ${contact.lastName}`.trim() || `User ${contact.id}`;
                option.textContent = `${displayName} (@${contact.username})`;
                select.appendChild(option);
            });

            showOutput({
                success: true,
                contactsFound: contacts.length,
                contacts: contacts,
                note: 'Kontak hanya menampilkan user yang pernah berinteraksi dengan bot',
                support: 'Ada masalah? Hubungi @MikuHost di Telegram',
                raw: result
            });
        } else {
            showOutput({
                success: false,
                error: result.description,
                support: 'Hubungi @MikuHost di Telegram untuk bantuan'
            });
        }
    } catch (error) {
        handleError(error, 'Gagal mengambil data kontak');
    }
}

// Kirim pesan ke kontak
async function sendMessageToContact() {
    const token = getToken();
    const contactSelect = document.getElementById('contactSelect');
    const contactId = contactSelect.value;
    const message = document.getElementById('contactMessageText').value.trim();
    
    if (!token || !contactId || !message) {
        alert('Token, kontak, dan pesan harus diisi!');
        return;
    }

    try {
        showOutput('🔄 Mengirim pesan ke kontak...');
        const result = await callTelegramAPI(token, 'sendMessage', {
            chat_id: contactId,
            text: message,
            parse_mode: 'HTML'
        });

        if (result.ok) {
            showOutput({
                success: true,
                message: 'Pesan berhasil dikirim ke kontak!',
                messageId: result.result.message_id,
                support: 'Butuh fitur lain? Hubungi @MikuHost di Telegram',
                raw: result
            });
        } else {
            showOutput({
                success: false,
                error: result.description,
                support: 'User mungkin memblokir bot. Hubungi @MikuHost untuk bantuan'
            });
        }
    } catch (error) {
        handleError(error, 'Gagal mengirim pesan ke kontak');
    }
}

// Kirim foto ke kontak
async function sendPhotoToContact() {
    const token = getToken();
    const contactSelect = document.getElementById('contactSelect');
    const contactId = contactSelect.value;
    const photoUrl = document.getElementById('contactPhotoUrl').value.trim();
    const caption = document.getElementById('contactPhotoCaption').value.trim();
    
    if (!token || !contactId || !photoUrl) {
        alert('Token, kontak, dan URL foto harus diisi!');
        return;
    }

    try {
        showOutput('🔄 Mengirim foto ke kontak...');
        const result = await callTelegramAPI(token, 'sendPhoto', {
            chat_id: contactId,
            photo: photoUrl,
            caption: caption
        });

        if (result.ok) {
            showOutput({
                success: true,
                message: 'Foto berhasil dikirim ke kontak!',
                support: 'Butuh fitur lain? Hubungi @MikuHost di Telegram',
                raw: result
            });
        } else {
            showOutput({
                success: false,
                error: result.description,
                support: 'URL foto mungkin tidak valid. Hubungi @MikuHost untuk bantuan'
            });
        }
    } catch (error) {
        handleError(error, 'Gagal mengirim foto ke kontak');
    }
}

async function sendMessage() {
    const token = getToken();
    const chatId = getSelectedGroup();
    const message = document.getElementById('messageText').value.trim();
    
    if (!token || !chatId || !message) {
        alert('Token, grup, dan pesan harus diisi!');
        return;
    }

    try {
        showOutput('🔄 Mengirim pesan...');
        const result = await callTelegramAPI(token, 'sendMessage', {
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
        });

        if (result.ok) {
            showOutput({
                success: true,
                message: 'Pesan berhasil dikirim!',
                messageId: result.result.message_id,
                support: 'Butuh fitur lain? Hubungi @MikuHost di Telegram',
                raw: result
            });
        } else {
            showOutput({
                success: false,
                error: result.description,
                support: 'Pastikan bot adalah admin di grup. Hubungi @MikuHost untuk bantuan'
            });
        }
    } catch (error) {
        handleError(error, 'Gagal mengirim pesan');
    }
}

async function sendPhoto() {
    const token = getToken();
    const chatId = getSelectedGroup();
    const photoUrl = document.getElementById('photoUrl').value.trim();
    const caption = document.getElementById('photoCaption').value.trim();
    
    if (!token || !chatId || !photoUrl) {
        alert('Token, grup, dan URL foto harus diisi!');
        return;
    }

    try {
        showOutput('🔄 Mengirim foto...');
        const result = await callTelegramAPI(token, 'sendPhoto', {
            chat_id: chatId,
            photo: photoUrl,
            caption: caption
        });

        if (result.ok) {
            showOutput({
                success: true,
                message: 'Foto berhasil dikirim!',
                support: 'Butuh fitur lain? Hubungi @MikuHost di Telegram',
                raw: result
            });
        } else {
            showOutput({
                success: false,
                error: result.description,
                support: 'URL foto mungkin tidak valid. Hubungi @MikuHost untuk bantuan'
            });
        }
    } catch (error) {
        handleError(error, 'Gagal mengirim foto');
    }
}

// Upload foto dari file
async function uploadPhotoFromFile() {
    const token = getToken();
    const chatId = getSelectedGroup();
    const fileInput = document.getElementById('groupPhoto');
    const caption = document.getElementById('uploadPhotoCaption').value.trim();
    
    if (!token || !chatId) {
        alert('Token dan grup harus dipilih!');
        return;
    }

    if (!fileInput.files || !fileInput.files[0]) {
        alert('Pilih foto terlebih dahulu!');
        return;
    }

    try {
        showOutput('🔄 Mengupload foto...');
        
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('photo', fileInput.files[0]);
        if (caption) {
            formData.append('caption', caption);
        }

        const result = await callTelegramAPIPost(token, 'sendPhoto', formData);

        if (result.ok) {
            showOutput({
                success: true,
                message: 'Foto berhasil diupload dan dikirim!',
                support: 'Butuh fitur lain? Hubungi @MikuHost di Telegram',
                raw: result
            });
        } else {
            showOutput({
                success: false,
                error: result.description,
                support: 'Ukuran file mungkin terlalu besar. Hubungi @MikuHost untuk bantuan'
            });
        }
    } catch (error) {
        handleError(error, 'Gagal mengupload foto: ' + error.message);
    }
}

// Upload foto grup dari file
async function editGroupPhoto() {
    const token = getToken();
    const chatId = getSelectedGroup();
    const fileInput = document.getElementById('groupPhoto');
    
    if (!token || !chatId) {
        alert('Token dan grup harus dipilih!');
        return;
    }

    if (!fileInput.files || !fileInput.files[0]) {
        alert('Pilih foto terlebih dahulu!');
        return;
    }

    try {
        showOutput('🔄 Mengubah foto grup...');
        
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('photo', fileInput.files[0]);

        const result = await callTelegramAPIPost(token, 'setChatPhoto', formData);

        if (result.ok) {
            showOutput({
                success: true,
                message: 'Foto grup berhasil diubah!',
                support: 'Butuh fitur lain? Hubungi @MikuHost di Telegram',
                raw: result
            });
        } else {
            showOutput({
                success: false,
                error: result.description,
                support: 'Pastikan bot memiliki izin mengubah foto grup. Hubungi @MikuHost untuk bantuan'
            });
        }
    } catch (error) {
        handleError(error, 'Gagal mengubah foto grup: ' + error.message);
    }
}

// Ubah foto profil bot
async function editBotPhoto() {
    const token = getToken();
    const fileInput = document.getElementById('botPhoto');
    
    if (!token) {
        alert('Token bot harus diisi!');
        return;
    }

    if (!fileInput.files || !fileInput.files[0]) {
        alert('Pilih foto terlebih dahulu!');
        return;
    }

    // Validasi ukuran file (max 10MB)
    const file = fileInput.files[0];
    if (file.size > 10 * 1024 * 1024) {
        alert('Ukuran foto maksimal 10MB!');
        return;
    }

    try {
        showOutput('🔄 Mengubah foto profil bot...');
        
        const formData = new FormData();
        formData.append('photo', fileInput.files[0]);

        const result = await callTelegramAPIPost(token, 'setUserProfilePhoto', formData);

        if (result.ok) {
            showOutput({
                success: true,
                message: 'Foto profil bot berhasil diubah!',
                support: 'Butuh fitur lain? Hubungi @MikuHost di Telegram',
                raw: result
            });
            
            // Reset file input
            fileInput.value = '';
        } else {
            showOutput({
                success: false,
                error: result.description,
                support: 'Gagal mengubah foto profil. Hubungi @MikuHost untuk bantuan'
            });
        }
    } catch (error) {
        handleError(error, 'Gagal mengubah foto profil bot: ' + error.message);
    }
}

// Ubah nama bot
async function editBotName() {
    const token = getToken();
    const name = document.getElementById('newBotName').value.trim();
    
    if (!token || !name) {
        alert('Token dan nama bot baru harus diisi!');
        return;
    }

    try {
        showOutput('🔄 Mengubah nama bot...');
        const result = await callTelegramAPI(token, 'setMyName', {
            name: name
        });

        if (result.ok) {
            showOutput({
                success: true,
                message: 'Nama bot berhasil diubah!',
                support: 'Butuh fitur lain? Hubungi @MikuHost di Telegram',
                raw: result
            });
            
            // Clear input
            document.getElementById('newBotName').value = '';
        } else {
            showOutput({
                success: false,
                error: result.description,
                support: 'Gagal mengubah nama bot. Hubungi @MikuHost untuk bantuan'
            });
        }
    } catch (error) {
        handleError(error, 'Gagal mengubah nama bot: ' + error.message);
    }
}

async function editGroupName() {
    const token = getToken();
    const chatId = getSelectedGroup();
    const title = document.getElementById('newGroupName').value.trim();
    
    if (!token || !chatId || !title) {
        alert('Token, grup, dan nama baru harus diisi!');
        return;
    }

    try {
        showOutput('🔄 Mengubah nama grup...');
        const result = await callTelegramAPI(token, 'setChatTitle', {
            chat_id: chatId,
            title: title
        });

        if (result.ok) {
            showOutput({
                success: true,
                message: 'Nama grup berhasil diubah!',
                support: 'Butuh fitur lain? Hubungi @MikuHost di Telegram',
                raw: result
            });
        } else {
            showOutput({
                success: false,
                error: result.description,
                support: 'Pastikan bot memiliki izin mengubah nama grup. Hubungi @MikuHost untuk bantuan'
            });
        }
    } catch (error) {
        handleError(error, 'Gagal mengubah nama grup');
    }
}

async function editDescription() {
    const token = getToken();
    const chatId = getSelectedGroup();
    const description = document.getElementById('newDescription').value.trim();
    
    if (!token || !chatId || !description) {
        alert('Token, grup, dan deskripsi harus diisi!');
        return;
    }

    try {
        showOutput('🔄 Mengubah deskripsi grup...');
        const result = await callTelegramAPI(token, 'setChatDescription', {
            chat_id: chatId,
            description: description
        });

        if (result.ok) {
            showOutput({
                success: true,
                message: 'Deskripsi grup berhasil diubah!',
                support: 'Butuh fitur lain? Hubungi @MikuHost di Telegram',
                raw: result
            });
        } else {
            showOutput({
                success: false,
                error: result.description,
                support: 'Pastikan bot memiliki izin mengubah deskripsi. Hubungi @MikuHost untuk bantuan'
            });
        }
    } catch (error) {
        handleError(error, 'Gagal mengubah deskripsi grup');
    }
}

async function editUsername() {
    const token = getToken();
    const chatId = getSelectedGroup();
    const username = document.getElementById('newUsername').value.trim();
    
    if (!token || !chatId || !username) {
        alert('Token, grup, dan username harus diisi!');
        return;
    }

    try {
        showOutput('🔄 Mengubah username grup...');
        const result = await callTelegramAPI(token, 'setChatUsername', {
            chat_id: chatId,
            username: username
        });

        if (result.ok) {
            showOutput({
                success: true,
                message: 'Username grup berhasil diubah!',
                support: 'Butuh fitur lain? Hubungi @MikuHost di Telegram',
                raw: result
            });
        } else {
            showOutput({
                success: false,
                error: result.description,
                support: 'Username mungkin sudah digunakan. Hubungi @MikuHost untuk bantuan'
            });
        }
    } catch (error) {
        handleError(error, 'Gagal mengubah username grup');
    }
}

async function getGroupLink() {
    const token = getToken();
    const chatId = getSelectedGroup();
    
    if (!token || !chatId) {
        alert('Token dan grup harus dipilih!');
        return;
    }

    try {
        showOutput('🔄 Mendapatkan link grup...');
        const result = await callTelegramAPI(token, 'exportChatInviteLink', {
            chat_id: chatId
        });

        if (result.ok) {
            showOutput({
                success: true,
                inviteLink: result.result,
                support: 'Butuh fitur lain? Hubungi @MikuHost di Telegram',
                raw: result
            });
        } else {
            showOutput({
                success: false,
                error: result.description,
                support: 'Pastikan bot memiliki izin membuat link undangan. Hubungi @MikuHost untuk bantuan'
            });
        }
    } catch (error) {
        handleError(error, 'Gagal mendapatkan link grup');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('Telegram Bot Panel Ready!');
    console.log('Support: @MikuHost di Telegram');
});