import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseManagerService } from "./database-manager.service";


describe('DatabaseManagerService', () => {
  let service: DatabaseManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseManagerService],
    }).compile();

    service = module.get<DatabaseManagerService>(DatabaseManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
