import { Test, TestingModule } from '@nestjs/testing';
import { SynologyService } from './synology.service';

describe('SynologyService', () => {
  let service: SynologyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SynologyService],
    }).compile();

    service = module.get<SynologyService>(SynologyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
