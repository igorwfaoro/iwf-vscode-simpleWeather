import * as vscode from 'vscode';
import OpenWeatherMap from 'openweathermap-ts';
import { GetByCityNameChild } from 'openweathermap-ts/dist/types';

interface WeatherLocation {
	cityName: string;
	countryCode: string;
}

const icons: { [key: string]: string } = {
	'01d': 'âï¸',
	'01n': 'ð',
	'02d': 'â',
	'02n': 'â',
	'03d': 'âï¸',
	'03n': 'âï¸',
	'04d': 'âï¸',
	'04n': 'âï¸',
	'09d': 'âï¸',
	'09n': 'âï¸',
	'10d': 'âï¸',
	'10n': 'âï¸',
	'11d': 'â¡ï¸',
	'11n': 'â¡ï¸',
	'13d': 'âï¸',
	'13n': 'âï¸',
	'50d': 'ð«',
	'50n': 'ð«'
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
			prompt: 'City. i.e.: SÃ£o Paulo,BR'
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
		const temperature = `${weatherInfo.main.temp.toFixed(1)} Â°C`;
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