// The amount of items can be very few or a lot but they should seem continuous when rotating

// make an option to keep the items horizontal.
// maybe the component <symbol> would be easier ?

// would be faster with transform attribute instead of styles ?

// la antirotacion se ha de aplicar solo a los elementos visibles.

// si no se pone la opcion wrap entonces habrá un tope de rotacion cuando se llegue al ultimo.

// use transform matrix instead ?

// use transforms with z = 0 for hardware acceleration ?

const dial = document.getElementById("dialTouchArea");
const dialCanvas = document.getElementById("dialCanvas");
const dialItemsGroup = document.getElementById("dialItemsGroup");
const dialItems = dialItemsGroup.children;

dial.addEventListener("touchstart", handleStart, false);
dial.addEventListener("touchmove", handleMove, false);
dial.addEventListener("touchend", handleEnd, false);

let moving = false;
let initialPoint;
let previousTouch;
let currentTouch;
let initialAngle = 0;
let currentAngle;
let angleBetweenItems = 0.6;

dialItemsGroup.style.transform = "rotate(" + initialAngle + "rad)";

const x = window.innerWidth / 2;
const y =
  window.innerHeight +
  ((300 - 200) * dialCanvas.getBoundingClientRect().height) / 200;
let centerPoint = [x, y];

function handleStart(e) {
  console.log("start");
  const touch = e.changedTouches[0];
  initialPoint = [touch.pageX, touch.pageY];
}

let positionIndexOffset = 0;
let firstItemPositionIndex = ((dialItems.length - 1) / 2) * -1; // firstVisibleItemIndex ?
let lastItemPositionIndex = (dialItems.length - 1) / 2;
let currentLast = dialItems.length - 1;
let currentFirst = 0;

function moveLastToBeginning(positionOffset) {
  // The first becomes the last.
  dialItems[currentLast % 5].style.transform =
    "rotate(" +
    (firstItemPositionIndex - positionOffset) * angleBetweenItems +
    "rad) translate(300px, 50px)";
  currentLast--;
  currentLast = currentLast < 0 ? dialItems.length - 1 : currentLast;
  currentFirst--;
  currentFirst = currentFirst < 0 ? dialItems.length - 1 : currentFirst;
  // update firstItemIndex ?
}

function moveFirstToEnd(positionOffset) {
  // The last becomes the first.
  dialItems[currentFirst % 5].style.transform =
    "rotate(" +
    (firstItemPositionIndex + positionOffset) * -1 * angleBetweenItems +
    "rad) translate(300px, 50px)";
  currentFirst++;
  currentLast++;
  // update firstItemIndex ?
}

function distribute() {
  let start = firstItemPositionIndex;
  for (let item of dialItems) {
    item.style.transform =
      "rotate(" + start * angleBetweenItems + "rad) translate(300px, 50px)";
    start++;
  }
}

distribute();

function handleMove(e) {
  if (initialPoint) {
    // This prevents the click event.
    e.preventDefault();

    const touch = e.changedTouches[0];
    const currentPoint = [touch.pageX, touch.pageY];

    // maybe instead of page use clientX clientY? check also the svg coordinates function

    currentAngle =
      initialAngle + angle3Points(currentPoint, initialPoint, centerPoint);

    if (currentAngle / angleBetweenItems > positionIndexOffset + 1) {
      console.log("clockwise shift");
      positionIndexOffset = Math.floor(currentAngle / angleBetweenItems);
      moveLastToBeginning(positionIndexOffset);
    } else if (currentAngle / angleBetweenItems < positionIndexOffset - 1) {
      console.log("counterclockwise shift");
      positionIndexOffset = Math.ceil(currentAngle / angleBetweenItems);
      moveFirstToEnd(positionIndexOffset);
    }

    dialItemsGroup.style.transform = "rotate(" + currentAngle + "rad)";
  }
}

function handleEnd() {
  console.log("end");
  initialAngle = currentAngle;
}

// TODO Angle direction missing?
// refactor to use arrays, it will be faster?

/*
 * Calculates the angle ABC (in radians)
 * pt1 first point, ex: [x, y]
 * pt2 second point
 * origin center point
 */
function angle3Points2(pt1, pt2, origin) {
  const AB = Math.sqrt(
    Math.pow(origin[0] - pt1[0], 2) + Math.pow(origin[1] - pt1[1], 2)
  );
  const BC = Math.sqrt(
    Math.pow(origin[0] - pt2[0], 2) + Math.pow(origin[1] - pt2[1], 2)
  );
  const AC = Math.sqrt(
    Math.pow(pt2[0] - pt1[0], 2) + Math.pow(pt2[1] - pt1[1], 2)
  );
  return Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
}

function vector(end, origin) {
  return [end[0] - origin[0], end[1] - origin[1]];
}

function angle3Points(pt1, pt2, origin) {
  const v1 = vector(pt1, origin);
  const v2 = vector(pt2, origin);
  return Math.atan2(v1[1], v1[0]) - Math.atan2(v2[1], v2[0]);
}

/*
  To normalize it to the range [0, 2 π):

  if (angle < 0) { angle += 2 * M_PI; }
  or to the range (-π, π]:
  
  if (angle > M_PI)        { angle -= 2 * M_PI; }
  else if (angle <= -M_PI) { angle += 2 * M_PI; }
*/
