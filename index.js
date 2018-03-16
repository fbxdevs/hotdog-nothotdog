const brain = require('brain.js');
const net = new brain.NeuralNetwork();
const jimp = require('jimp');
const fs = require('fs');

let hotdogs = [];

let nothotdogs = [];

const trainData = [];

function getLineArrayFromFile(filename) {
	return new Promise((resolve, reject) => {
		fs.readFile(`${__dirname}/${filename}`, 'utf8', (err, data) => {
			if(err)
				reject(err);
			else {
				const results = data.split('\n');
				resolve(results.reduce((ret, str) => {
					if(str != '')
						ret.push(str);

					return ret;
				}, []));
			}
		});
	});
}

function readHotdogs() {
	return getLineArrayFromFile('hotdogs');
}

function readNothotdogs() {
	return getLineArrayFromFile('nothotdogs');
}

function addData(image, result) {
	data = [];
	image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, i) => {
		const r = image.bitmap.data[i + 0] / 255;
		const g = image.bitmap.data[i + 1] / 255;
		const b = image.bitmap.data[i + 2] / 255;

		data.push({
			r, g, b,
		});
	});

	trainData.push({
		input: data,
		output: result,
	});
}

function addHotdogs() {
	return new Promise(async (resolve, reject) => {
		const promises = [];
		hotdogs.forEach((hotdog) => {
			promises.push(new Promise(async (res, rej) => {
				try {
					const image = await jimp.read(hotdog);
					addData(image, 1);
					res();
				}
				catch(err) {
					rej(err);
				}
			}));
		});

		try {
			await Promise.all(promises);
			resolve();
		}
		catch(err) {
			reject(err);
		}
	});
}

function addNothotdogs() {
	return new Promise(async (resolve, reject) => {
		const promises = [];
		nothotdogs.forEach((nothotdog) => {
			promises.push(new Promise(async (res, rej) => {
				try {
					const image = await jimp.read(nothotdog);
					addData(image, 0);
					res();
				}
				catch(err) {
					rej(err);
				}
			}));
		});

		try {
			await Promise.all(promises);
			resolve();
		}
		catch(err) {
			reject(err);
		}
	});
}

/* eslint-disable */
async function run() {
	try {
		console.log('Reading hotdog urls...');
		hotdogs = [...hotdogs, ...(await readHotdogs())];

		console.log('Reading nothotdog urls...');
		nothotdogs = [...hotdogs, ...(await readNothotdogs())];

		console.log('Adding hotdogs to training data...');
		await addHotdogs();

		console.log('Adding nothotdogs to training data...');
		await addNothotdogs();

		console.log('Training...');
		net.train(trainData, {iterations: 20000});

		console.log('Training complete. Writing network to file...');
		fs.writeFileSync('./results.json', JSON.stringify(net.toJSON()));
		console.log('Network written to results.json');
	}
	catch(err) {
		console.error(err);
	}
}
/* eslint-enable */

run();
