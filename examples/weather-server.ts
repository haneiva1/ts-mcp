import { MCPServer, Tool, Resource, Prompt } from '../src'

class WeatherTools {
  @Tool({ name: 'get_weather', description: 'Get current weather for a city' })
  async getWeather({ city }: { city: string }) {
    return { city, temp: '22°C', condition: 'Sunny' }
  }

  @Resource({ uri: 'weather://supported-cities', name: 'Supported Cities' })
  getCities() { return 'New York, London, Tokyo' }

  @Prompt({ name: 'weather_report', description: 'Generate a weather report' })
  weatherReport({ city = 'my location' }: { city?: string }) {
    return `Generate a detailed weather report for ${city}.`
  }
}

new MCPServer({ name: 'weather-mcp', version: '1.0.0' })
  .register(new WeatherTools())
  .start()
