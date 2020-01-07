export default function Legend(options={}){

    let data = [];

    const container = options.container ? document.getElementById(options.container) : null;

    const init = (options)=>{

        if(!container){
            console.error('container is requird to init legend');
            return;
        }

        data = options.data || [];

        // console.log('init legend', data);

        if(data){
            render();
        }
    };

    // adjust the opacity of the legend item based on current map scale
    // use a very large number if the current scale is not defined, so it will assume the current scale covers the entire world
    const render = (currentScale=1000000000)=>{
        
        if(data.length){
            //console.log(data)
            const componentHtml = data.map((d,i)=>{
                // const color = `rgb(${d.color.slice(0,3).join(',')})`;
                const isTargetLayerInVisibleRange = d.minVisibleScale >= currentScale  ? true : false;
                const isInactive = d.minVisibleScale && !isTargetLayerInVisibleRange ? 'is-inactive' : '';
                return `
                    <div class='trailer-quarter legend-item ${isInactive}'>
                        <div class='inline-block legend-icon margin-right-half' data-index='${i}'></div>
                        <span class='font-size--2'>${d.label}</span>
                    </div>
                `;
                // return `
                //     <div class='trailer-quarter legend-item'>
                //         <div class='inline-block legend-icon margin-right-half' style='background-color:${color};'></div>
                //         <span class='font-size--2'>${d.label}</span>
                //     </div>
                // `;
            }).join('');
    
            container.innerHTML = componentHtml;
        }

    };

    return {
        init,
        render
    };
};