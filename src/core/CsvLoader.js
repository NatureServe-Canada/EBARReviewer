const CsvLoader = ({
    targetDomElementId = '',
    onLoadHandler = null
}={})=>{

    const isFileReaderAvailable = typeof window.FileReader === 'undefined' ? false : true;
    const tagetDomElement = targetDomElementId ? document.getElementById(targetDomElementId) : null

    const init = ()=>{
        
        if(!tagetDomElement){
            console.error(`Failed to init Csv Loader >>> target DOM element (${targetDomElementId}) for Csv Loade is not available`);
            return;
        }

        if(!isFileReaderAvailable){
            console.error('Failed to init Csv Loader >>> File Reader is not supported.');
            return;
        }

        initEventHandlers();

    };

    const initEventHandlers = ()=>{

        tagetDomElement.ondragover = ()=>{
            // console.log('ondragover');
            return false;
        };

        tagetDomElement.ondragend = ()=>{
            // console.log('ondragend');
            return false;
        };

        tagetDomElement.ondrop = (e)=>{

            // console.log('ondrop');

            e.preventDefault();

            const file = e.dataTransfer.files[0];

            const reader = new FileReader();

            reader.onload = (event)=>{
                const csvString = event.target.result;
                const csvData = parseCsvString(csvString);

                if(onLoadHandler){
                    onLoadHandler(csvData);
                }
            };

            reader.readAsText(file);

            return false;
        };

    };

    const parseCsvString = (csvString='')=>{
        const csvDataAsArr = csvToArray(csvString);

        const columns = csvDataAsArr[0].map(d=>{
            const isLatitude = d.match(/\b(latitude)\b|\b(lat)\b/gi) ? true : false;
            const isLongitude = d.match(/\b(longitude)\b|\b(lon)\b/gi) ? true : false;
            return {
                isLatitude,
                isLongitude,
                name: d
            }
        });

        const dataRows = csvDataAsArr.slice(1);

        const features = dataRows.map((feature)=>{
            
            const attributes = {};
            const geometry = {};

            feature.forEach((attribute, index)=>{
                if(columns[index]){
                    const key = columns[index].name;
                    attributes[key] = attribute;

                    if(columns[index].isLongitude){
                        geometry.x = +attribute
                    }

                    if(columns[index].isLatitude){
                        geometry.y = +attribute
                    }
                }
            });

            if(geometry.x && geometry.y){
                geometry.type = 'point';
            }

            // console.log(geometry, attributes);

            return {
                geometry,
                attributes
            };

        }).filter(d=>d.geometry.type);

        return {
            features
        };
    };

    // use the solution found from this StackOverflow thread: https://stackoverflow.com/questions/1293147/javascript-code-to-parse-csv-data
    const csvToArray = (strData, strDelimiter)=>{
        // Check to see if the delimiter is defined. If not,
        // then default to comma.
        strDelimiter = (strDelimiter || ",");

        // Create a regular expression to parse the CSV values.
        const objPattern = new RegExp(
            (
                // Delimiters.
                "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

                // Quoted fields.
                "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

                // Standard fields.
                "([^\"\\" + strDelimiter + "\\r\\n]*))"
            ),
            "gi"
        );


        // Create an array to hold our data. Give the array
        // a default empty first row.
        const arrData = [[]];

        // Create an array to hold our individual pattern
        // matching groups.
        let arrMatches = null;


        // Keep looping over the regular expression matches
        // until we can no longer find a match.
        while (arrMatches = objPattern.exec( strData )){

            // Get the delimiter that was found.
            let strMatchedDelimiter = arrMatches[ 1 ];

            // Check to see if the given delimiter has a length
            // (is not the start of string) and if it matches
            // field delimiter. If id does not, then we know
            // that this delimiter is a row delimiter.
            if (
                strMatchedDelimiter.length &&
                strMatchedDelimiter !== strDelimiter
                ){

                // Since we have reached a new row of data,
                // add an empty row to our data array.
                arrData.push( [] );

            }

            let strMatchedValue;

            // Now that we have our delimiter out of the way,
            // let's check to see which kind of value we
            // captured (quoted or unquoted).
            if (arrMatches[ 2 ]){

                // We found a quoted value. When we capture
                // this value, unescape any double quotes.
                strMatchedValue = arrMatches[ 2 ].replace(
                    new RegExp( "\"\"", "g" ),
                    "\""
                    );

            } else {
                // We found a non-quoted value.
                strMatchedValue = arrMatches[ 3 ];
            }


            // Now that we have our value string, let's add
            // it to the data array.
            arrData[ arrData.length - 1 ].push( strMatchedValue );
        }

        // Return the parsed data.
        return( arrData );
    }

    return {
        init
    };
    
};

export default CsvLoader;