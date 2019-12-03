import './style.scss';
import config from '../../config';

export default function(options={
    containerID: ''
}){
    const container = options.containerID ? document.getElementById(options.containerID) : null;
    
    const init = (options={
        onCloseHandler: null,
        onClickHandler: null
    })=>{
        if(!container){
            console.error('containerID is required to init List View for overall feedback...');
        }

        initEventHandlers(options);
    }

    const initEventHandlers = (options={})=>{

        container.addEventListener('click', (evt)=>{

            if(evt.target.classList.contains('js-close') && options.onCloseHandler){
                options.onCloseHandler();
            }

            // if(evt.target.classList.contains('js-show-huc') && options.onClickHandler){
            //     options.onClickHandler(evt.target.dataset.value);
            //     setActiveRow(evt.target.dataset.value);
            //     // console.log(evt.target.dataset.value);
            // }
        });
    };


    const render = (options={
        data: [],
        hucName: ''
    })=>{

        console.log(options);

        const headerHtml = `
            <div class='trailer-quarter'>
                <span class='icon-ui-left cursor-pointer js-close'></span>
                <span class='font-size--1'>All feedbacks for ${options.hucName}</span>
            </div>
        `;

        const tableRowsHtml = options.data.map(d=>{
            const status = +d.attributes[config.FIELD_NAME.feedbackTable.status];
            const userID = d.attributes[config.FIELD_NAME.feedbackTable.userID];
            const comment = d.attributes[config.FIELD_NAME.feedbackTable.comment];

            const statusLable = {
                1: 'Add',
                2: 'Remove',
                3: 'n/a'
            };

            return `
                <tr class='review-data-row font-size--3'>
                    <td>${userID}</td>
                    <td>${statusLable[status]}</td>
                    <td>${comment}</td>
                </tr>
            `
        }).join('');

        const tableHtml = `
            <table class="table table-striped">
                <thead>
                    <tr class='font-size--2'>
                        <th>User</th>
                        <th>Action</th>
                        <th>Comment</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRowsHtml}
                </tbody>
            </table>
        `;

        const componentHtml = `
            <div class='leader-1'>
                ${headerHtml}
                ${tableHtml}
            </div>
        `;

        container.innerHTML = componentHtml;
    };

    const toggleVisibility = (isVisible)=>{
        container.classList.toggle('hide', !isVisible);
    }; 

    const isVisible = ()=>{
        return !container.classList.contains('hide');
    };

    return {
        init,
        render,
        toggleVisibility,
        isVisible
    };
}