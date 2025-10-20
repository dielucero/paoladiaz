// Simple JavaScript for the artist website
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    var navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            var targetId = this.getAttribute('href');
            var targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Music Player functionality
    initMusicPlayer();

    // Gallery Lightbox functionality
    initGalleryLightbox();

    // Contact form handling (if present)
    var contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var name = document.getElementById('name').value;
            var email = document.getElementById('email').value;
            var message = document.getElementById('message').value;
            if (!name || !email || !message) {
                alert('Por favor, completa todos los campos');
                return;
            }
            var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Por favor, ingresa un email válido');
                return;
            }
            alert('¡Mensaje enviado! Te contactaremos pronto.');
            contactForm.reset();
        });
    }

    // Add loading animation
    window.addEventListener('load', function() {
        document.body.style.opacity = '1';
    });
});

// Gallery Lightbox Functions
function initGalleryLightbox() {
    const images = Array.from(document.querySelectorAll('.gallery-image'));
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || images.length === 0) return;

    const lightboxImg = lightbox.querySelector('.lightbox-image');
    const btnPrev = lightbox.querySelector('.lightbox-prev');
    const btnNext = lightbox.querySelector('.lightbox-next');
    const btnClose = lightbox.querySelector('.lightbox-close');

    let currentIndex = 0;

    function openLightbox(index) {
        currentIndex = index;
        updateLightboxImage();
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function updateLightboxImage() {
        const img = images[currentIndex];
        if (img) {
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt || 'Imagen de galería ampliada';
        }
    }

    function prev() {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        updateLightboxImage();
    }

    function next() {
        currentIndex = (currentIndex + 1) % images.length;
        updateLightboxImage();
    }

    images.forEach((img, idx) => {
        img.addEventListener('click', () => openLightbox(idx));
        img.setAttribute('tabindex', '0');
        img.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openLightbox(idx);
            }
        });
    });

    btnPrev && btnPrev.addEventListener('click', prev);
    btnNext && btnNext.addEventListener('click', next);
    btnClose && btnClose.addEventListener('click', closeLightbox);

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('open')) return;
        if (e.key === 'Escape') return closeLightbox();
        if (e.key === 'ArrowLeft') return prev();
        if (e.key === 'ArrowRight') return next();
    });
}

// Music Player Functions
function initMusicPlayer() {
    // Playlist de canciones (puedes cambiar estas rutas por tus archivos MP3)
    const playlist = [
        {
            title: "Amor superficial",
            file: "./music/cancion1.mp3",
            duration: "3:45"
        },
        {
            title: "Corre", 
            file: "./music/cancion2.mp3",
            duration: "4:12"
        },
        {
            title: "Equivocada",
            file: "./music/cancion3.mp3", 
            duration: "3:28"
        },
        {
            title: "No sabía",
            file: "./music/cancion4.mp3",
            duration: "3:50"
        }
    ];

    let currentSongIndex = 0;
    let isPlaying = false;
    let isLooping = true; // Loop activado por defecto

    const audio = document.getElementById('audio-player');
    const playBtn = document.getElementById('play-btn');
    const nextBtn = document.getElementById('next-btn');
    const stopBtn = document.getElementById('stop-btn');
    const playlistBtn = document.getElementById('playlist-btn');
    const playlistDropdown = document.getElementById('playlist-dropdown');
    const currentSongEl = document.getElementById('current-song');
    const songItems = document.querySelectorAll('.song-item');

    // Cargar la primera canción
    loadSong(currentSongIndex);

    // Event listeners
    playBtn.addEventListener('click', playSong);
    nextBtn.addEventListener('click', nextSong);
    stopBtn.addEventListener('click', stopSong);
    playlistBtn.addEventListener('click', togglePlaylist);
    
    // Click en items de la playlist
    songItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            currentSongIndex = index;
            loadSong(currentSongIndex);
            playSong();
            playlistDropdown.classList.remove('show'); // Cerrar playlist después de seleccionar
        });
    });

    // Cerrar playlist al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!playlistBtn.contains(e.target) && !playlistDropdown.contains(e.target)) {
            playlistDropdown.classList.remove('show');
        }
    });

    // Cuando termine la canción
    audio.addEventListener('ended', () => {
        if (isLooping) {
            nextSong();
        }
    });

    function loadSong(index) {
        const song = playlist[index];
        audio.src = song.file;
        
        // Actualizar el texto de la marquesina
        updateMarquee(song.title);
        
        // Actualizar playlist visual
        songItems.forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
    }

    function updateMarquee(text) {
        const marqueeElement = document.getElementById('current-song');
        marqueeElement.textContent = text;
        
        // Determinar si el texto es corto o largo
        const marqueeContainer = document.querySelector('.song-marquee');
        const containerWidth = marqueeContainer.offsetWidth;
        const textWidth = marqueeElement.scrollWidth;
        
        // Reiniciar la animación
        marqueeElement.style.animation = 'none';
        marqueeElement.offsetHeight; // Trigger reflow
        
        if (textWidth <= containerWidth) {
            // Texto corto - centrar sin animación
            marqueeElement.classList.add('short-text');
        } else {
            // Texto largo - animación de marquesina
            marqueeElement.classList.remove('short-text');
            marqueeElement.style.animation = 'marquee 12s linear infinite';
        }
    }

    function playSong() {
        audio.play();
        isPlaying = true;
        playBtn.textContent = '⏸';
    }

    function stopSong() {
        audio.pause();
        audio.currentTime = 0;
        isPlaying = false;
        playBtn.textContent = '▶';
    }

    function nextSong() {
        currentSongIndex = (currentSongIndex + 1) % playlist.length;
        loadSong(currentSongIndex);
        if (isPlaying) {
            playSong();
        }
    }

    function togglePlaylist() {
        playlistDropdown.classList.toggle('show');
    }

    // Función para cambiar el loop (opcional)
    function toggleLoop() {
        isLooping = !isLooping;
        console.log('Loop:', isLooping ? 'Activado' : 'Desactivado');
    }

    // Hacer funciones globales para debugging
    window.musicPlayer = {
        toggleLoop,
        nextSong,
        playSong,
        stopSong
    };
}

// Removed forced body opacity changes to avoid blank page if JS errors occur
