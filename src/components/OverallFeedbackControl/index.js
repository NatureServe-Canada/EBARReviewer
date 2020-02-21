import "./style.scss";

export default function () {
  let container = null;
  let onSubmitHandler = null;
  let onSubmitSaveHandler = null;
  let onCloseHandler = null;

  let rating = 0;
  let comment = "";

  const init = (options = {}) => {
    container = options.containerID
      ? document.getElementById(options.containerID)
      : null;
    onSubmitHandler = options.onSubmitHandler || null;
    onSubmitSaveHandler = options.onSubmitSaveHandler || null;
    onCloseHandler = options.onCloseHandler || null;

    // rating = options.rating || rating;
    // comment = options.comment || comment;

    if (!container) {
      console.error("containerID is required to init Overall Feedback Control");
      return;
    }

    // render();

    initEventHandler();
  };

  const setRating = (val = 0) => {
    rating = +val;
    // console.log('setRating', rating);
  };

  const setComment = (val = "") => {
    comment = val;
    // console.log('setComment', comment);
  };

  const render = () => {
    // const comment = data.comment || '';

    if (!comment) {
      comment = " " //a "" comment will render as null in the html, so send in a space
    }

    const compoenetHtml = `
            <div id='overallFeedbackControlPanelContainer' class='panel panel-black'>
                <div class="text-center">
                    <h4>Please provide overall range feedback</h4>
                </div>

                <div class="text-center">${getRatingStarHtml()}</div>

                <div class='leader-half'>
                    <label>
                        <span class='font-size--3'>Overall comment:</span>
                        <textarea type="text" placeholder="" class="comment-textarea" rows="4" maxlength="4095">${comment}</textarea>
                    </label>
                </div>

                <div class='leader-half trailer-half action-btn-wrap' style="display: flex;
                justify-content: space-between;">
                    <btn class='btn btn-half js-close' style="margin:2px;" id="ofcClose">Close</btn>
                    <btn class='btn btn-half js-submit' style="margin:2px;">Save</btn>
                    <btn class='btn btn-half js-submitsave' style="margin:2px;">Submit</btn>
                </div>
            </div>
        `;

    container.innerHTML = compoenetHtml;
  };

  const getRatingStarHtml = () => {
    const arrOfRatingStarHtml = [];

    for (let i = 0, len = 5; i < len; i++) {
      const starColor = i < rating ? `icon-ui-yellow` : `icon-ui-gray`;
      const itemHtm = `<span class="js-set-rating icon-ui-favorites icon-ui-flush ${starColor}" data-rating='${i +
        1}'></span>`;
      arrOfRatingStarHtml.push(itemHtm);
    }

    return arrOfRatingStarHtml.join("");
  };

  const toggleRating = (rating = 0) => {
    // console.log('calling toggleRating', rating, isRemove)

    // if(isRemove){
    //     setRating(rating-1);
    // } else {
    //     setRating(rating);
    // }

    setRating(rating);

    render();
  };

  const initEventHandler = () => {
    container.addEventListener("click", function (event) {
      if (event.target.classList.contains("js-close")) {
        onCloseHandler();
      }

      if (event.target.classList.contains("js-set-rating")) {
        const isRemoveRatingStar = event.target.classList.contains(
          "icon-ui-yellow"
        )
          ? true
          : false;
        toggleRating(event.target.dataset.rating);
      }

      if (event.target.classList.contains("js-submit")) {
        if (!rating) {
          alert("please provide a star rating");
          return;
        }

        onSubmitHandler({
          rating,
          comment
        });
      }
      if (event.target.classList.contains("js-submitsave")) {
        if (!rating) {
          alert("please provide a star rating");
          return;
        }

        onSubmitSaveHandler({
          rating,
          comment
        });
      }

    });

    container.addEventListener("input", function (event) {
      // console.log(event.target);
      setComment(event.target.value);
    });
  };

  const toggleVisibility = (isVisible = false) => {
    container.classList.toggle("hide", !isVisible);
  };

  const open = (data = { rating: 0, comment: "" }) => {
    console.log(data);
    setRating(data.rating);
    setComment(data.comment);

    render();
    toggleVisibility(true);
    checkState(data);
  };

  const checkState = data => {
   //debugger
   console.log('data.datecompleted',data.datecompleted);
 
    if (data.datecompleted) {
      // document.getElementById("overallFeedbackControlPanelContainer").style.pointerEvents = "none";
      // document.getElementById("ofcClose").style.pointerEvents = "auto";
    }
    else{
      document.getElementById("overallFeedbackControlPanelContainer").style.pointerEvents = "auto";
    }
  }

    const close = () => {
      setRating();
      setComment();
      toggleVisibility(false);
    };

    return {
      init,
      // toggleVisibility,
      open,
      close,
    //  checkState
    };
  }
