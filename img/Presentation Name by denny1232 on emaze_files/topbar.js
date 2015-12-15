var EM_topbar = {
    to_openPaymentSurvey: false,
    FisrtOpenningOfContactUs: true
};

EM_topbar.showPaymentSurvey = function (show) {
    console.log('EM_topbar.showPaymentSurvey', show);
    //kill penidng popup in both cases
    if (EM_topbar.to_openPaymentSurvey) {
        window.clearTimeout(EM_topbar.to_openPaymentSurvey);
        EM_topbar.to_openPaymentSurvey = false;
    }
    if (show) {
        $('#payment-survey-iframe').css('display', 'block').attr('src', "//www.emaze.com/quest-test");
        EM_topbar.to_openPaymentSurvey = setTimeout(function () {
            $('#my-account-payment-survey-iframe').removeClass('no-opacity');
            EM_topbar.to_openPaymentSurvey = false;
        }, 2500);
    }
}


EM_topbar.showPricingPromotion = function (stage) {
    switch (stage) {

        // start iframe page loading, keep it hidden
        case 1:
            $('#my-account-payment-survey-iframe').addClass('no-opacity').removeClass('laptop-no-display');
            $('#payment-survey-iframe').css('display', 'block').attr('src', '//www.emaze.com/popups/pricing-monthly/').removeClass('laptop-no-display');
            break;

         // after page loaded, show the page, and tell it to start playing the animation
        case 2:
            $('#my-account-payment-survey-iframe').removeClass('no-opacity');
            var iframe = document.getElementById('payment-survey-iframe');
            iframe.contentWindow.postMessage('start', '*');
            break;

        // closeing up - hide it
        case 3:
            $('#my-account-payment-survey-iframe').addClass('no-opacity');
            $('#payment-survey-iframe').attr('src', '');
            break;
        deafult:
            break;
    }
}


EM_topbar.getMessageFromIframe = function(e)
{
    if (e.data == 'price-pop-loaded')
        EM_topbar.showPricingPromotion(2);
}

window.addEventListener('message', EM_topbar.getMessageFromIframe, false);


function showMyAccountPopup() {
    $('#my-account-iframe').attr('src', '/account/myaccount');
    $('#my-account-iframe-container').show();
}

function closeMyAccountPopup() {
    $('#my-account-iframe-container').hide();
}

function showPricingPopup(url) {
    if (window["EM_Document"] && window["EM_Document"]['$mainWrapper']) {
        EM_Document.$mainWrapper.css('visibility', 'hidden');
    }
    $('#pricing-overlay').show();
    $('#pricing-iframe').attr('src', url);
    $('#pricing-iframe-container').show();

    /* ---
    var ezlogged = $.cookie('ezlogged');
    if (ezlogged.indexOf('amir@playwagon.com') != -1)
    --- */
    EM_topbar.showPricingPromotion(1);
   
}

function closePricingPopup() {

    //EM_topbar.showPaymentSurvey(false);

    if (window["EM_Document"] && window["EM_Document"]['$mainWrapper']) {
        EM_Document.$mainWrapper.css('visibility', 'visible');
    }

    $('#pricing-iframe-container').hide();
    $('#pricing-iframe').attr('src', '');
    $('#pricing-overlay').hide();

    EM_topbar.showPricingPromotion(3); // hide it
}

function OpenSupport() {
    var url = "//www.emaze.com/support/";
    window.open(url);
}

function OpenBlog() {
    var url = "//www.emaze.com/blog/";
    window.open(url);
}

function OpenTutorial() {
    var l = window.location.href;
    if (l.indexOf('/editor/') != -1) {
        showTutorial(true); //function from editor.js
    } else {
        showTutorialOnce(); // function from my-presentations.js
    }
}

function OpenContactUsPop() {
    if (EM_topbar.FisrtOpenningOfContactUs === true) {
        var contactUsIframe = '<div id="contact-us-iframe-overlay"><div id="contact-us-iframe-container-new" class="iframe-popup-container"><div id="contact-us-iframe-close"></div><iframe id="contact-us-iframe-new" class="iframe-popup" src="https://www.emaze.com/contact-us-pop-new" seamless></iframe></div></div>';
        $('body').append(contactUsIframe);
        EM_topbar.FisrtOpenningOfContactUs = false;
    }
    $('#contact-us-iframe-overlay').css('display', 'block');
}

$(function () {
    // NOTE: Currently this file is in Production settings only. 
    // If it needs to change sometime, use the #if vars through the cshtml files to define a variable which will be used the in JS
    //PRODUCTION 
    var pricingPageUrl = "//emaze.com/payment/pricing.php?t=";
    //LOCAL/TEST/STAGING
    //var pricingPageUrl = "//emazetest.com/payment/pricing.php?t=";

    // ezzopim cookie = "True" if user is not free, getcookie returns null if no cookie is found
    var ezzopim = getCookie('ezzopim'),
        isFree = !(ezzopim && ezzopim === "True");

    function openPricingPopup() {
        $.cookie("ezorigin", 'APP', { path: '/' });
        showPricingPopup(pricingPageUrl);
    }

    EM_topbar.openPricingPopup = openPricingPopup;
    $('#topbar-login-icon').click(function () {
        $('#account-dropdown-elements').show();
    });



    $('#topbar-login-icon').click(function () {
        $('#account-dropdown-elements').show();
    });


    $('#account-dropdown').miniDropdown();
    $('#account-dropdown-elements').hide();
    $('#topbar-weblogo').click(function () {
        window.location = window.EM_Editor ? '/' : "//www.emaze.com?emazehome";
    });

    //$('#topbar-help-icon').click(function () {
    //    showTutorial(false);
    //})

    $('#log-off-button').click(function () {
        localStorage.setItem('logoff', 'true');
    });
    $('.topbar-plan-icon').click(function () {
        openPricingPopup();
        ga('send', 'event', 'Premium', 'upgrade-btn', username);
    });
    $('#pricing-iframe-close').click(function () {
        closePricingPopup();
    });
    $('#pricing-overlay').click(function () {
        closePricingPopup();
        //$('#pricing-overlay').hide();
    });
    $('#my-account-close').click(function () {
        closeMyAccountPopup();
    });

    $(document).on('click', '#contact-us-iframe-overlay, #contact-us-iframe-close', function () { $('#contact-us-iframe-overlay').css('display', 'none'); });

    function logoffStorageEventHandler(event) {
        if (localStorage["logoff"]) {
            localStorage.removeItem("logoff");
            window.location = "/Account/LogOff";
        }
    }

    function getCookie(cookieName) {
        var cookieString, cookieStringArray, result;

        cookieString = document.cookie;
        if (cookieString.indexOf(cookieName) == -1) { return null; }
        cookieStringArray = cookieString.split(cookieName + "=");
        result = cookieStringArray[1].split(';');
        return result[0];
    }

});
