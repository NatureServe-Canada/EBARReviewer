export default function(){

    let hucsWithFeedbacks = {};

    const setHucsWithFeedbacks = (species, features)=>{
        hucsWithFeedbacks[species] = features;
    };

    const getHucsWithFeedbacks = (species)=>{
        if(!species){
            console.error('species is required to get Hucs with Feedbacks');
        }
        return hucsWithFeedbacks[species];
    };

    return {
        setHucsWithFeedbacks,
        getHucsWithFeedbacks
    }
}