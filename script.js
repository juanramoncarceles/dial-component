const dial = document.getElementById("dialTouchArea");
const dialCanvas = document.getElementById("dialCanvas");
const dialSemicircle = document.getElementById("dialSemicircle");
const dialItemsGroup = document.getElementById("dialItemsGroup");
const middleCircle = document.getElementById("middleCircle");
const arcGradient = document.getElementById("arcGradient");
const dialItems = dialItemsGroup.children;

dial.addEventListener("touchstart", handleStart, false);
dial.addEventListener("touchmove", handleMove, false);
dial.addEventListener("touchend", handleEnd, false);

const straighten = true;
let moving = false;
let initialPoint;
let previousTouch;
let currentTouch;
let initialAngle = 0;
let currentAngle;
const angleBetweenItems = 0.2;
/**
 * This is the angle area of the arc that is used to ditribute items.
 * TODO This could be dynamic depending on the case.
 */
const distributionAngleThreshold = Math.PI;

dialItemsGroup.style.transform = "rotate(" + initialAngle + "rad)";

// The outer dimensions of the dial semicircle in SVG coordinates.
const SEMICIRCLEWIDTH = 600;
const SEMICIRCLEHEIGHT = 300;

const middleButtonHeight = 40;
const semiCircleThickness = 50;

const arcAxis = semiCircleThickness / 2;

const semiCircleInnerRadius = SEMICIRCLEHEIGHT - semiCircleThickness;

const absoluteArcAxis = semiCircleInnerRadius + semiCircleThickness / 2;

middleCircle.setAttribute("r", semiCircleInnerRadius);

const viewBoxHeight = middleButtonHeight + semiCircleThickness;

const viewBoxWidth =
  semiCircleInnerRadius *
  Math.sin(
    Math.acos((SEMICIRCLEHEIGHT - viewBoxHeight) / semiCircleInnerRadius)
  ) *
  2;

dialCanvas.setAttribute(
  "viewBox",
  `${(SEMICIRCLEWIDTH - viewBoxWidth) / 2} 0 ${viewBoxWidth} ${viewBoxHeight}`
);

arcGradient.setAttribute(
  "gradientTransform",
  "translate(" +
    (SEMICIRCLEWIDTH - viewBoxWidth) / 2 +
    ", " +
    (SEMICIRCLEHEIGHT - viewBoxHeight / 2) +
    ")"
);
arcGradient.setAttribute("fr", semiCircleInnerRadius);
arcGradient.setAttribute("r", semiCircleInnerRadius + 15);

const semiCirclePath = `M 0,300 H ${semiCircleThickness} A ${semiCircleInnerRadius},${semiCircleInnerRadius} 0 0 1 ${
  SEMICIRCLEHEIGHT * 2 - semiCircleThickness
},300 H 600 A 300,300 0 0 0 0,300 Z`;

dialSemicircle.setAttribute("d", semiCirclePath);

const x = window.innerWidth / 2;
const y =
  window.innerHeight +
  ((SEMICIRCLEHEIGHT - viewBoxHeight) *
    dialCanvas.getBoundingClientRect().height) /
    viewBoxHeight;

let centerPoint = [x, y];

function handleStart(e) {
  console.log("start");
  const touch = e.changedTouches[0];
  initialPoint = [touch.pageX, touch.pageY];
}

const dialItemsAmount = dialItems.length;
let positionIndexOffset = 0;
let firstItemPositionIndex = ((dialItemsAmount - 1) / 2) * -1;
let firstVisibleItemIndex;
let currentLastVisible;
let currentFirstVisible;

/**
 * Called when passing an angle step when rotating clockwise.
 * Applies a transformation to show a new item from the left,
 * and to hide the current right-most item.
 * @param {number} positionOffset Integer that corresponds to the amount
 * of passed angle steps for the current rotation from the initial rotation.
 */
function negativeRotationItemReposition(positionOffset) {
  // Hide the one that was visible from the right.
  dialItems[currentLastVisible].style.display = "none";
  dialItems[currentLastVisible].style.transform = "";
  currentLastVisible--;
  currentLastVisible =
    currentLastVisible < 0 ? dialItemsAmount - 1 : currentLastVisible;
  // Show a new one from the left.
  currentFirstVisible--;
  currentFirstVisible =
    currentFirstVisible < 0 ? dialItemsAmount - 1 : currentFirstVisible;
  dialItems[currentFirstVisible].style.display = "unset";
  const newAngle = (firstVisibleItemIndex - positionOffset) * angleBetweenItems;
  dialItems[currentFirstVisible].style.transform =
    "rotate(" +
    newAngle +
    "rad) translate(0px, -" +
    absoluteArcAxis +
    "px) rotate(calc(" +
    -newAngle +
    "rad - var(--current-angle, " +
    -newAngle +
    "rad))) translate(300px, 300px)";
}

/**
 * Called when passing an angle step when rotating counterclockwise.
 * Applies a transformation to show a new item from the right,
 * and to hide the current left-most item.
 * @param {number} positionOffset Integer that corresponds to the amount
 * of passed angle steps for the current rotation from the initial rotation.
 */
function positiveRotationItemReposition(positionOffset) {
  // Hide the one that was visible from the left.
  dialItems[currentFirstVisible].style.display = "none";
  dialItems[currentFirstVisible].style.transform = "";
  currentFirstVisible++;
  currentFirstVisible =
    currentFirstVisible > dialItemsAmount - 1 ? 0 : currentFirstVisible;
  // Show a new one from the right.
  currentLastVisible++;
  currentLastVisible =
    currentLastVisible > dialItemsAmount - 1 ? 0 : currentLastVisible;
  dialItems[currentLastVisible].style.display = "unset";
  const newAngle = (firstVisibleItemIndex + positionOffset) * angleBetweenItems;
  dialItems[currentLastVisible].style.transform =
    "rotate(" +
    -newAngle +
    "rad) translate(0px, -" +
    absoluteArcAxis +
    "px) rotate(calc(" +
    newAngle +
    "rad - var(--current-angle, " +
    newAngle +
    "rad))) translate(300px, 300px)";
}

function distribute() {
  let start = firstItemPositionIndex;
  const angleLimit = distributionAngleThreshold / 2;
  let currentFirstVisibleCounter = 0;
  firstVisibleItemIndex = firstItemPositionIndex;

  for (let item of dialItems) {
    const itemAngle = start * angleBetweenItems;

    if (itemAngle < -angleLimit) {
      // Hide if it is out of the negative angle limit.
      item.style.display = "none";
      // Update counters to detect the first visible.
      currentFirstVisibleCounter++;
      firstVisibleItemIndex++;
    } else if (itemAngle > angleLimit) {
      // Hide if it is out of the positive angle limit.
      item.style.display = "none";
    } else {
      // Set the real angle.
      item.style.transform =
        "rotate(" +
        itemAngle +
        "rad) translate(0px, " +
        (SEMICIRCLEHEIGHT - arcAxis) * -1 +
        "px) rotate(calc(" +
        -itemAngle +
        "rad - var(--current-angle, " +
        -itemAngle +
        "rad))) translate(300px, 300px)";
    }

    if (straighten) {
      // This css variable will be the responsible to keep the items horizontal.
      dialItemsGroup.style.setProperty("--current-angle", "0rad");

      // TODO apply to each item its initial angle rotation (like the one set inline now)
    }

    start++;
  }

  currentFirstVisible = currentFirstVisibleCounter;
  currentLastVisible = dialItemsAmount - 1 - currentFirstVisibleCounter;

  console.log(currentFirstVisible, currentLastVisible, firstVisibleItemIndex);
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
      positionIndexOffset = Math.floor(currentAngle / angleBetweenItems);
      console.log("clockwise shift", positionIndexOffset);
      negativeRotationItemReposition(positionIndexOffset);
    } else if (currentAngle / angleBetweenItems < positionIndexOffset - 1) {
      positionIndexOffset = Math.ceil(currentAngle / angleBetweenItems);
      console.log("counterclockwise shift");
      positiveRotationItemReposition(positionIndexOffset);
    }

    if (straighten) {
      // By setting this value css calc() will keep items horizontal.
      dialItemsGroup.style.setProperty("--current-angle", currentAngle + "rad");
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
