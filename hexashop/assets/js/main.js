document.addEventListener('DOMContentLoaded', function() {
    // Fade-in effect for image grid
    const imageItems = document.querySelectorAll('.image-item');
    imageItems.forEach((item, index) => {
        setTimeout(() => {
            item.style.opacity = 1;
        }, index * 100);
    });

    // Navigation for overlay buttons
    const overlayButtons = document.querySelectorAll(".overlay .btn");
    overlayButtons.forEach(button => {
        button.addEventListener("click", function(e) {
            e.preventDefault();
            const action = this.textContent.trim();
            let url;

            switch (action) {
                case 'Shop Now':
                    url = '/women-collection';
                    break;
                case 'Download App':
                    url = '/mobile-app';
                    break;
                case 'Contact Us':
                    url = '/contact-us';
                    break;
                case 'Shop Kids':
                    url = '/kids-collection';
                    break;
                case 'Shop Accessories':
                    url = '/travel-essentials';
                    break;
                default:
                    return;
            }
            window.location.href = url;
        });
    });

    // Carousel functionality
    const carousels = document.querySelectorAll('.carousel');
    carousels.forEach(carousel => {
        const container = carousel.querySelector('.carousel-container');
        const prevBtn = carousel.querySelector('.carousel-control.prev');
        const nextBtn = carousel.querySelector('.carousel-control.next');
        const items = carousel.querySelectorAll('.carousel-item');
        
        if (items.length === 0) return;

        let currentIndex = 0;
        const itemWidth = items[0].offsetWidth + 20; // Assumes a 20px margin-right

        function updateCarousel() {
            container.style.transform = `translateX(-${currentIndex * itemWidth}px)`;
        }

        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateCarousel();
            }
        });

        nextBtn.addEventListener('click', () => {
            // Assuming 3 items are visible at a time
            if (currentIndex < items.length - 3) {
                currentIndex++;
                updateCarousel();
            }
        });
    });
});