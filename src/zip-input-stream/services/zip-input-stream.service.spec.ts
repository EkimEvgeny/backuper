import { Test, TestingModule } from '@nestjs/testing';
import { ZipInputStreamService } from './zip-input-stream.service';

describe('ZipInputStreamService', () => {
  let service: ZipInputStreamService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ZipInputStreamService],
    }).compile();

    service = module.get<ZipInputStreamService>(ZipInputStreamService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

});
