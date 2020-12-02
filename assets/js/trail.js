let rgbRand = { r: 255, g: 255, b: 255 }; // first color

class Point {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.lifetime = 0;
	}
}


startAnimation = () => {
	const canvas = document.getElementById("canvas");
	const ctx = canvas.getContext("2d");
	const points = [];
	const addPoint = (x, y) => {
		const point = new Point(x, y);
		points.push(point);
	};

	document.addEventListener(
		"mousemove",
		({ clientX, clientY }) => {
			addPoint(clientX - canvas.offsetLeft, clientY - canvas.offsetTop);
		},
		false
	);

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	window.addEventListener(
		"resize",
		({ target: { innerWidth, innerHeight } }) => {
			canvas.width = innerWidth;
			canvas.height = innerHeight;
		},
		false
	);

	const animatePoints = () => {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		const duration = (0.5 * (1 * 1000)) / 144;

		for (let i = 0; i < points.length; ++i) {
			const point = points[i];
			let lastPoint;

			if (points[i - 1] !== undefined) {
				lastPoint = points[i - 1];
			} else lastPoint = point;

			point.lifetime += 0.1;

			if (point.lifetime > duration) {
				points.shift();
			} else {
				const lifePercent = point.lifetime / duration;
				const spreadRate = 2 * (1 - lifePercent);

				ctx.lineJoin = "round";
				ctx.lineWidth = spreadRate;

				const red = rgbRand.r;
				const green = rgbRand.g;
				const blue = rgbRand.b;
				ctx.strokeStyle = `rgb(${red},${green},${blue}`;

				ctx.beginPath();

				ctx.moveTo(lastPoint.x, lastPoint.y);
				ctx.lineTo(point.x, point.y);

				ctx.stroke();
				ctx.closePath();
			}
		}
		requestAnimationFrame(animatePoints);
	};
	animatePoints();
};

startAnimation();

function rand() {
	rgbRand = {
		r: Math.random() * 255,
		g: Math.random() * 255,
		b: Math.random() * 255
	};
	setTimeout(() => {
		rand();
	}, 5000);
}

function randomInteger(min, max) {
	return Math.floor(min + Math.random() * (max + 1 - min));
}


function waitForImageToLoad(imageElement) {
	return new Promise(resolve => {
		imageElement.onload = resolve;
	});
}
