const songs = [
    'music/theme02.mp3',
    'music/theme03.mp3',
    'music/theme04.mp3',
    'music/theme05.mp3',
    'music/theme06.mp3',
    'music/theme07.mp3',
    'music/theme08.mp3',
    'music/theme09.mp3',
    'music/theme10.mp3',
    'music/theme11.mp3',
    'music/theme12.mp3',
    'music/theme13.mp3',
    'music/theme14.mp3',
    'music/theme15.mp3',
    'music/theme16.mp3',
];

let currentIndex = 0;
let isLooping = false;
let isRandomPlaying = false; // Thêm biến để theo dõi phát ngẫu nhiên
let audio = document.createElement('audio');
let isPlaying = false;

audio.addEventListener('ended', function() {
    if (isLooping) {
        audio.play();
    } else if (isRandomPlaying) {
        playRandomSong(); // Phát bài hát ngẫu nhiên khi hết bài
    } else {
        nextSong();
    }
});

function previousSong() {
    currentIndex = (currentIndex - 1 + songs.length) % songs.length;
    playSong();
    updatePlayButton();
}

function nextSong() {
    currentIndex = (currentIndex + 1) % songs.length;
    playSong();
    updatePlayButton();
}

function playSequential() {
    const playButton = document.querySelector('.play-button');

    if (isPlaying) {
        audio.pause(); // Tạm dừng nhạc
        playButton.innerHTML = '▶️'; // Đổi sang biểu tượng phát
    } else {
        playSong(); // Phát nhạc từ vị trí đã dừng
        playButton.innerHTML = '⏸️'; // Đổi sang biểu tượng tạm dừng
    }
    isPlaying = !isPlaying; // Đổi trạng thái chơi

    // Đảm bảo chuyển đổi trạng thái của các nút khác nếu cần
    document.querySelectorAll('.other-button').forEach(button => {
        button.disabled = isPlaying; // Vô hiệu hóa các nút khác khi đang phát
    });
}



function playSong() {
    if (audio.src !== songs[currentIndex]) {
        audio.src = songs[currentIndex];
        audio.currentTime = 0; // Đặt lại thời gian hiện tại nếu bài hát đổi
    }
    audio.play();
    updatePlayButton();
}

function pauseSong() {
    audio.pause(); // Tạm dừng nhạc
    isPlaying = false; // Cập nhật trạng thái
    document.querySelector('.play-button').innerHTML = '▶️'; // Đặt lại nút phát
}

function stopSong() {
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false; // Đặt lại trạng thái chơi
    document.querySelector('.play-button').innerHTML = '▶️'; // Đặt lại nút phát
}

function toggleLoop() {
    if (isRandomPlaying) {
        return; // Nếu đang phát ngẫu nhiên, không làm gì cả
    }
    isLooping = !isLooping;
    const loopButton = document.querySelector('.loop-button');
    loopButton.classList.toggle('active', isLooping);

    // Cập nhật trạng thái của nút phát
}

function playRandomSong() {
    const randomButton = document.querySelector('.random-button');

    if (isRandomPlaying) {
        isRandomPlaying = false; // Tắt phát ngẫu nhiên
        randomButton.classList.remove('active'); // Bỏ lớp active
        stopSong(); // Dừng bài hát
    } else {
        if (isLooping) {
            toggleLoop(); // Tắt vòng lặp nếu đang bật
        }
        isRandomPlaying = true; // Bật phát ngẫu nhiên
        randomButton.classList.add('active'); // Thêm lớp active
        currentIndex = Math.floor(Math.random() * songs.length); // Chọn bài hát ngẫu nhiên
        playSong(); // Phát bài hát ngẫu nhiên
    }

    // Cập nhật nút phát khi bật/tắt phát ngẫu nhiên
    updatePlayButton();
}




function updatePlayButton() {
    const playButton = document.querySelector('.play-button');
    playButton.innerHTML = (isPlaying || isLooping || isRandomPlaying) ? '⏸️' : '▶️'; // Cập nhật biểu tượng
}