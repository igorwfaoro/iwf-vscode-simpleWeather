import * as vscode from 'vscode';
import OpenWeatherMap from 'openweathermap-ts';
import { GetByCityNameChild } from 'openweathermap-ts/dist/types';

interface WeatherLocation {
	cityName: string;
	countryCode: string;
}

const icons: { [key: string]: string } = {
	'01d': '☀️',
	'01n': '🌙',
	'02d': '⛅',
	'02n': '⛅',
	'03d': '☁️',
	'03n': '☁️',
	'04d': '☁️',
	'04n': '☁️',
	'09d': '☔️',
	'09n': '☔️',
	'10d': '☔️',
	'10n': '☔️',
	'11d': '⚡️',
	'11n': '⚡️',
	'13d': '❄️',
	'13n': '❄️',
	'50d': '🌫',
	'50n': '🌫'
};

const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, -10);

let openWeather: OpenWeatherMap;

let apiKey: string | undefined = vscode.workspace.getConfiguration('SimpleWeather').get('apiKey');
let weatherLocation: WeatherLocation | undefined = vscode.workspace.getConfiguration('SimpleWeather').get('weatherLocation');

let timer: NodeJS.Timer;

export function activate(context: vscode.ExtensionContext) {

	const updateConfiguration = async () => {

		const newLocation = await vscode.window.showInputBox({
			value: weatherLocation ? `${weatherLocation.cityName},${weatherLocation.countryCode}` : '',
			ignoreFocusOut: true,
			prompt: 'City. i.e.: São Paulo,BR'
		});

		if (newLocation) {
			const [cityName, countryCode] = newLocation.split(',').map(x => x.trim());
			weatherLocation = { cityName, countryCode };
			vscode.workspace.getConfiguration('SimpleWeather').update('weatherLocation', newLocation, vscode.ConfigurationTarget.Global);
		}

		const newApiKey = await vscode.window.showInputBox({
			value: apiKey,
			ignoreFocusOut: true,
			prompt: 'API Key for OpenWeatherMap.org'
		});

		if (newApiKey) {
			apiKey = newApiKey;
			vscode.workspace.getConfiguration('SimpleWeather').update('apiKey', newApiKey, vscode.ConfigurationTarget.Global);
		}

		init();
	}

	const init = () => {
		if (!apiKey || !weatherLocation) {
			updateConfiguration();
			return;
		}

		openWeather = new OpenWeatherMap({ apiKey });
		openWeather.setUnits('metric');

		getWeather();

		clearInterval(timer);
		timer = setInterval(getWeather, 5000);
	}

	const getWeather = async () => {
		if (!openWeather) return;

		const weatherInfo = await openWeather.getCurrentWeatherByCityName(weatherLocation as GetByCityNameChild);

		const icon = icons[weatherInfo.weather[0].icon];
		const temperature = `${weatherInfo.main.temp.toFixed(1)} °C`;
		const title = weatherInfo.weather[0].main;
		const description = weatherInfo.weather[0].description;
		const pressure = weatherInfo.main.pressure;
		const humidity = `${weatherInfo.main.humidity}%`;

		statusBar.text = `${icon} ${temperature}`;

		statusBar.tooltip = [
			weatherLocation?.cityName,
			`${icon} ${title} - ${description}`,
			`Temperature: ${temperature}`,
			`Pressure: ${pressure}`,
			`Humidity: ${humidity}`
		].join('\n');

		statusBar.show();
	}

	context.subscriptions.push(vscode.commands.registerCommand('simple-weather.updateConfiguration', updateConfiguration));

	if (apiKey && weatherLocation)
		init();
}

// "onCommand:simple-weather.getWeather"

// init('f72e77354550ff786b084a919dc0d280', {
// 	cityName: 'Caxias do Sul',
// 	countryCode: 'BR'
// });