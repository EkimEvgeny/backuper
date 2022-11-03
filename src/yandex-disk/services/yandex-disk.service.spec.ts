import { Test, TestingModule } from '@nestjs/testing';
import { YandexDiskService } from './yandex-disk.service';

describe('YandexDiskService', () => {
  let service: YandexDiskService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [YandexDiskService],
    }).compile();

    service = module.get<YandexDiskService>(YandexDiskService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
