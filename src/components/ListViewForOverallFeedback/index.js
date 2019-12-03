import config from '../../config';

export default function(options={
    containerID: '',
    onClickHandler: null
}){
    const container = options.containerID ? document.getElementById(options.containerID) : null;
    
    const init = (options={
        onClickHandler: null
    })=>{
        if(!container){
            console.error('containerID is required to init List View for overall feedback...');
        }

        // const onClickHandler = options.onClickHandler;

        initEventHandlers(options.onClickHandler);
    }

    const initEventHandlers = (onClickHandler)=>{

        container.addEventListener('click', (evt)=>{

            if(evt.target.classList.contains('js-user-on-click')){
                if(onClickHandler){
                    onClickHandler(evt.target.dataset.value);
                }
                // console.log(evt.target.dataset.value);
            }
        });
    };

    const getRatingStarHtml = (rating)=>{
        
        const arrOfRatingStarHtml = [];

        for(let i = 0, len = 5; i < len ; i++){

            const starColor = i < rating ? `icon-ui-yellow` : `icon-ui-gray`;
            const itemHtm = `<span class="js-set-rating icon-ui-favorites icon-ui-flush ${starColor}" data-rating='${i+1}'></span>`
            arrOfRatingStarHtml.push(itemHtm);
        }

        return arrOfRatingStarHtml.join('');
    };

    const render = (data)=>{

        const headerHtml = `<h6>Overall Feedback from all users</h6>`

        const listViewCardsHtml = data.length ? 
        data.map(d=>{
            const user = d.attributes[config.FIELD_NAME.overallFeedback.userID];
            const rating = d.attributes[config.FIELD_NAME.overallFeedback.rating];
            const comment = d.attributes[config.FIELD_NAME.overallFeedback.comment];
            return `
                <div class='panel panel-black trailer-half'>
                    <div class='trailer-quarter cursor-pointer'>
                        <span class='font-size--1 js-user-on-click' data-value='${user}'>${user}</span>
                    </div>
                    <div class='trailer-quarter'>${getRatingStarHtml(rating)}</div>
                    <div>
                        <span class='font-size--2'>${comment}</span>
                    </div>
                </div>
            `
        }).join('') : 
        `<p class='font-size--2'>No overall feedback for selected species</p>`

        const componentHtml = `
            <div class='leader-1'>
                ${headerHtml}
                ${listViewCardsHtml}
            </div>
        `;

        container.innerHTML = componentHtml;
    };

    const toggleVisibility = (isVisible)=>{
        container.classList.toggle('hide', !isVisible);
    }; 

    return {
        init,
        render,
        toggleVisibility
    };
}