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

/**
 * If true the dial items will be always horizontal by applying a counter rotation.
 */
const straighten = true;
/**
 * The angle between each of the items in the dial in radians.
 */
const angleBetweenItems = 0.2;

/**
 * Internal variables.
 */
let moving = false;
let initialAngle = 0;
let initialPoint, previousTouch, currentTouch, currentAngle;

/**
 * This is the angle area of the arc that is used to ditribute items.
 * TODO This could be dynamic depending on the case.
 */
const distributionAngleThreshold = Math.PI;

/**
 * Applying the initial rotation to the dial.
 */
dialItemsGroup.style.transform = "rotate(" + initialAngle + "rad)";

/**
 * The outer dimensions of the dial semicircle in SVG coordinates.
 */
const DIAL_EXTERNAL_RADIUS = 300;

const middleButtonHeight = 40;
const semiCircleThickness = 50;

const arcAxis = semiCircleThickness / 2;

const semiCircleInnerRadius = DIAL_EXTERNAL_RADIUS - semiCircleThickness;

const absoluteArcAxis = semiCircleInnerRadius + semiCircleThickness / 2;

middleCircle.setAttribute("r", semiCircleInnerRadius);

const viewBoxHeight = middleButtonHeight + semiCircleThickness;

const viewBoxWidth =
  semiCircleInnerRadius *
  Math.sin(
    Math.acos((DIAL_EXTERNAL_RADIUS - viewBoxHeight) / semiCircleInnerRadius)
  ) *
  2;

dialCanvas.setAttribute(
  "viewBox",
  `${
    (DIAL_EXTERNAL_RADIUS * 2 - viewBoxWidth) / 2
  } 0 ${viewBoxWidth} ${viewBoxHeight}`
);

arcGradient.setAttribute(
  "gradientTransform",
  "translate(" +
    (DIAL_EXTERNAL_RADIUS * 2 - viewBoxWidth) / 2 +
    ", " +
    (DIAL_EXTERNAL_RADIUS - viewBoxHeight / 2) +
    ")"
);
arcGradient.setAttribute("fr", semiCircleInnerRadius);
arcGradient.setAttribute("r", semiCircleInnerRadius + 15);

const semiCirclePath = `M 0,300 H ${semiCircleThickness} A ${semiCircleInnerRadius},${semiCircleInnerRadius} 0 0 1 ${
  DIAL_EXTERNAL_RADIUS * 2 - semiCircleThickness
},300 H 600 A 300,300 0 0 0 0,300 Z`;

dialSemicircle.setAttribute("d", semiCirclePath);

const x = window.innerWidth / 2;
const y =
  window.innerHeight +
  ((DIAL_EXTERNAL_RADIUS - viewBoxHeight) *
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
/**
 * The item index of the first item visible from the left.
 * The item index is the index of the item counting from the middle item.
 * For example, for three items their indexes would be: -1 0 1
 */
let firstVisibleItemIndex;
/**
 * Index of the current last visible item (the right-most item) in the dialItems array.
 */
let currentLastVisible;
/**
 * Index of the current first visible item (the left-most item) in the dialItems array.
 */
let currentFirstVisible;

/**
 * Creates the string that corresponds to the CSS transform for the given values.
 * @param {number} positionOffset Integer that corresponds to the amount
 * of passed angle steps for the current rotation from the initial rotation.
 * @param {number} direction 1 for positive (counterclockwise) and 0 for negative (clockwise).
 */
function createItemTransformation(positionOffset, direction) {
  if (direction) positionOffset = positionOffset * -1;
  let newAngle = (firstVisibleItemIndex - positionOffset) * angleBetweenItems;
  if (direction) newAngle = newAngle * -1;
  return (
    "rotate(" +
    newAngle +
    "rad) translate(0px, -" +
    absoluteArcAxis +
    "px) rotate(calc(" +
    -newAngle +
    "rad - var(--current-angle, " +
    -newAngle +
    "rad))) translate(300px, 300px)"
  );
}

/**
 * Calculates the new index for the item by increasing or decreasing it by one.
 * @param {number} currentIndex
 * @param {number} totalAmount
 * @param {number} direction 1 for positive (counterclockwise) and 0 for negative (clockwise).
 */
function shiftItemIndex(currentIndex, totalAmount, direction) {
  direction ? currentIndex++ : currentIndex--;
  return direction
    ? currentIndex > totalAmount - 1
      ? 0
      : currentIndex
    : currentIndex < 0
    ? totalAmount - 1
    : currentIndex;
}

/**
 * Called after a rotation step has been passed, so an
 * item should be hidden and another one displayed.
 * Rotation step corresponds to the angle between two items.
 * @param {number} positionOffset Integer that corresponds to the amount
 * of passed angle steps for the current rotation from the initial rotation.
 * @param {number} direction 1 for positive (counterclockwise) and 0 for negative (clockwise).
 */
function rotationItemManagement(
  positionOffset,
  itemToHideIndex,
  itemToShowIndex,
  direction
) {
  // Hide item.
  dialItems[itemToHideIndex].style.display = "none";
  dialItems[itemToHideIndex].style.transform = "";
  // Show an item.
  dialItems[itemToShowIndex].style.display = "unset";
  dialItems[itemToShowIndex].style.transform = createItemTransformation(
    positionOffset,
    direction
  );
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
        (DIAL_EXTERNAL_RADIUS - arcAxis) * -1 +
        "px) rotate(calc(" +
        -itemAngle +
        "rad - var(--current-angle, " +
        -itemAngle +
        "rad))) translate(300px, 300px)";
    }

    if (straighten) {
      // This css variable will be the responsible to keep the items horizontal.
      dialItemsGroup.style.setProperty("--current-angle", "0rad");
    }

    start++;
  }

  currentFirstVisible = currentFirstVisibleCounter;
  currentLastVisible = dialItemsAmount - 1 - currentFirstVisibleCounter;
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
      currentFirstVisible = shiftItemIndex(
        currentFirstVisible,
        dialItemsAmount,
        0
      );
      rotationItemManagement(
        positionIndexOffset,
        currentLastVisible,
        currentFirstVisible,
        0
      );
      currentLastVisible = shiftItemIndex(
        currentLastVisible,
        dialItemsAmount,
        0
      );
    } else if (currentAngle / angleBetweenItems < positionIndexOffset - 1) {
      positionIndexOffset = Math.ceil(currentAngle / angleBetweenItems);
      currentLastVisible = shiftItemIndex(
        currentLastVisible,
        dialItemsAmount,
        1
      );
      rotationItemManagement(
        positionIndexOffset,
        currentFirstVisible,
        currentLastVisible,
        1
      );
      currentFirstVisible = shiftItemIndex(
        currentFirstVisible,
        dialItemsAmount,
        1
      );
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

function vector(end, origin) {
  return [end[0] - origin[0], end[1] - origin[1]];
}

function angle3Points(pt1, pt2, origin) {
  const v1 = vector(pt1, origin);
  const v2 = vector(pt2, origin);
  return Math.atan2(v1[1], v1[0]) - Math.atan2(v2[1], v2[0]);
}
