/*!
    * Start Bootstrap - SB Admin v7.0.7 (https://startbootstrap.com/template/sb-admin)
    * Copyright 2013-2023 Start Bootstrap
    * Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-sb-admin/blob/master/LICENSE)
    */
    // 
// Scripts
// 
// Rebirth toggle
const rebirthIcon = DOMUtils.getElement('rebirth-icon-clickable');
if (rebirthIcon) {
    rebirthIcon.addEventListener('click', () => {
        const isRebirth = StateManager.toggleRebirth();
        const rebirthStatus = DOMUtils.getElement('rebirth-status-icon');
        if (rebirthStatus) {
            rebirthStatus.classList.toggle('active', isRebirth);
        }
        
        // Update max levels on input/slider
        const maxLevel = isRebirth ? 
            FO2Config.GAME.LEVEL.REBIRTH_CAP : 
            FO2Config.GAME.LEVEL.NORMAL_CAP;
        
        if (levelInput) levelInput.max = maxLevel;
        if (levelSlider) levelSlider.max = maxLevel;
    });
}


window.addEventListener('DOMContentLoaded', event => {

    // Toggle the side navigation
    const sidebarToggle = document.body.querySelector('#sidebarToggle');
    if (sidebarToggle) {
        // Uncomment Below to persist sidebar toggle between refreshes
        // if (localStorage.getItem('sb|sidebar-toggle') === 'true') {
        //     document.body.classList.toggle('sb-sidenav-toggled');
        // }
        sidebarToggle.addEventListener('click', event => {
            event.preventDefault();
            document.body.classList.toggle('sb-sidenav-toggled');
            localStorage.setItem('sb|sidebar-toggle', document.body.classList.contains('sb-sidenav-toggled'));
        });
    }

});
