document.addEventListener('DOMContentLoaded', function() {
    const imageItems = document.querySelectorAll('.image-item');

    imageItems.forEach((item,index) => {
        setTimeout(() => {
            item.style.opacity = 1;
        }, index * 100);
    });
});

const overlayButtons = document.querySelectorAll(".overlay-button");

overlayButtons.forEach(button => {
    button.addEventListener("click", function(e) {
        e.preventDefault();
        const action = this.textContent.trim();

        switch (action) {
            case 'Shop Now':
                window.location.href = '/women-collection';
                break;
            case 'Download App':
                window.location.href = '/mobile-app';
                break;
            case 'Contact Us':
                window.location.href = '/contact-us';
                break;
            case 'Shop Kids':
                window.location.href = '/kids-collection';
                break;
            case 'Explore Travel':
                window.location.href = '/travel-essentials';
                break;
        }
    });
});

const carouselContainer = document.querySelector('.carousel-container');
const prevButton = document.querySelector('.carousel-control.prev');
const nextButton = document.querySelector('.carousel-control.next');
const carouselItems = document.querySelectorAll('.carousel-item');

let currentIndex = 0;
const itemWidth = carouselItems[0].offsetWidth + 20;

function updateCarousel(index) {
    carouselContainer.style.transform = `translateX(-${index * itemWidth}px)`;
}

prevButton.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        updateCarousel(currentIndex);
    }
});

nextButton.addEventListener('click', () => {
    if (currentIndex < carouselItems.length - 3) {
        currentIndex++;
        updateCarousel(currentIndex);
    }
});