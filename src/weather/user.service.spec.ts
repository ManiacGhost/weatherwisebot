import { Test, TestingModule } from '@nestjs/testing';
import { WeatherServices } from './weather.service';

describe('WeatherServices', () => {
  let service: WeatherServices;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WeatherServices],
    }).compile();

    service = module.get<WeatherServices>(WeatherServices);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
