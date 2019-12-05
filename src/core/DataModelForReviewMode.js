export default function(){

    let ecoShapesWithFeedbacks = {}; //hucsWithFeedbacks

    const setEcosWithFeedbacks = (species, features)=>{
        ecoShapesWithFeedbacks[species] = features;
    };

    const getEcosWithFeedbacks = (species)=>{
        if(!species){
            console.error('species is required to get ecoshapes with Feedbacks');
        }
        return ecoShapesWithFeedbacks[species];
    };

    return {
        setEcosWithFeedbacks,
        getEcosWithFeedbacks
    }
}