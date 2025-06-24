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