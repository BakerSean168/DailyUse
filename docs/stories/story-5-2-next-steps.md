# Story 5-2: Smart Reminder Frequency - Next Steps Guide

> **Current Status**: Infrastructure Layer ✅ Complete  
> **Next Phase**: Application Service Layer  
> **Priority**: P0  
> **Estimated Time**: 1-1.5 weeks

---

## 🎯 Overview

The Infrastructure layer is complete. Now we need to implement the **Application Service Layer** that will:
1. Analyze user response patterns
2. Calculate effectiveness scores
3. Suggest and apply frequency adjustments
4. Provide API endpoints for frontend

---

## 📋 Implementation Checklist

### Phase 1: Core Analysis Service (2-3 days)

#### 1. Create `SmartFrequencyAnalysisService`

**Location**: `/workspaces/DailyUse/apps/api/src/modules/reminder/application/services/SmartFrequencyAnalysisService.ts`

**Responsibilities**:
- Analyze response patterns from `reminder_responses` table
- Calculate clickRate, ignoreRate, avgResponseTime
- Compute effectiveness score (0-100)
- Identify low-performing reminders

**Key Methods**:

```typescript
export class SmartFrequencyAnalysisService {
  constructor(
    private reminderTemplateRepository: IReminderTemplateRepository,
    private prisma: PrismaClient, // For raw response queries
  ) {}

  /**
   * Analyze a single reminder template
   * Returns updated metrics or null if insufficient data
   */
  async analyzeTemplate(templateId: string): Promise<ResponseMetrics | null> {
    // 1. Fetch last 30 days of responses from reminder_responses
    // 2. Calculate metrics
    // 3. Return ResponseMetrics object
  }

  /**
   * Analyze all active templates for an account
   */
  async analyzeAllTemplates(accountUuid: string): Promise<AnalysisReport> {
    // 1. Get all active templates
    // 2. Analyze each template
    // 3. Update ReminderTemplate.responseMetrics
    // 4. Save via repository
  }

  /**
   * Calculate effectiveness score
   * Formula: (clickRate × 0.5) + ((100 - ignoreRate) × 0.3) + (responsiveness × 0.2)
   */
  private calculateEffectivenessScore(
    clickRate: number,
    ignoreRate: number,
    avgResponseTime: number,
  ): number {
    const responsiveness = Math.min(100, (60 / avgResponseTime) * 100);
    return (
      clickRate * 0.5 +
      (100 - ignoreRate) * 0.3 +
      responsiveness * 0.2
    );
  }

  /**
   * Determine if frequency adjustment is needed
   */
  shouldAdjustFrequency(
    effectivenessScore: number,
    ignoreRate: number,
    sampleSize: number,
  ): 'decrease' | 'increase' | 'no_change' {
    if (sampleSize < 10) return 'no_change'; // Insufficient data

    if (effectivenessScore < 20 && ignoreRate > 80) {
      return 'decrease'; // Decrease by 3x
    } else if (effectivenessScore < 40 && ignoreRate > 60) {
      return 'decrease'; // Decrease by 2x
    } else if (effectivenessScore > 80 && ignoreRate < 20) {
      return 'increase'; // Optional increase
    }

    return 'no_change';
  }
}
```

**Test Cases**:
```typescript
describe('SmartFrequencyAnalysisService', () => {
  it('should calculate effectiveness score correctly', () => {
    // Given: clickRate=80%, ignoreRate=20%, avgResponseTime=30s
    // Expected: effectivenessScore > 70
  });

  it('should return null when sample size < 10', () => {
    // Given: template with 5 responses
    // Expected: null (insufficient data)
  });

  it('should suggest decrease when effectivenessScore < 20', () => {
    // Given: clickRate=10%, ignoreRate=90%
    // Expected: 'decrease' recommendation
  });
});
```

---

#### 2. Create `FrequencyAdjustmentService`

**Location**: `/workspaces/DailyUse/apps/api/src/modules/reminder/application/services/FrequencyAdjustmentService.ts`

**Responsibilities**:
- Apply frequency adjustments
- Handle user acceptance/rejection
- Send adjustment notifications

**Key Methods**:

```typescript
export class FrequencyAdjustmentService {
  constructor(
    private reminderTemplateRepository: IReminderTemplateRepository,
    private notificationService: NotificationService,
  ) {}

  /**
   * User accepts the suggested adjustment
   */
  async acceptAdjustment(templateId: string): Promise<void> {
    const template = await this.reminderTemplateRepository.findById(templateId);
    if (!template) throw new Error('Template not found');

    // Apply the adjustment
    template.confirmFrequencyAdjustment();
    
    // Update trigger interval
    // (This depends on how trigger intervals are stored)
    
    await this.reminderTemplateRepository.save(template);
  }

  /**
   * User rejects the suggested adjustment
   */
  async rejectAdjustment(templateId: string): Promise<void> {
    const template = await this.reminderTemplateRepository.findById(templateId);
    if (!template) throw new Error('Template not found');

    template.rejectFrequencyAdjustment();
    
    await this.reminderTemplateRepository.save(template);
  }

  /**
   * System automatically applies adjustment
   */
  async applyAutoAdjustment(
    templateId: string,
    adjustment: {
      originalInterval: number;
      adjustedInterval: number;
      reason: string;
    },
  ): Promise<void> {
    const template = await this.reminderTemplateRepository.findById(templateId);
    if (!template) throw new Error('Template not found');

    // Create FrequencyAdjustment value object
    const frequencyAdjustment = FrequencyAdjustment.create({
      originalInterval: adjustment.originalInterval,
      adjustedInterval: adjustment.adjustedInterval,
      adjustmentReason: adjustment.reason,
      adjustmentTime: Date.now(),
      isAutoAdjusted: true,
      userConfirmed: false,
    });

    template.adjustFrequency(frequencyAdjustment);
    
    await this.reminderTemplateRepository.save(template);

    // Send notification to user
    await this.notificationService.sendAdjustmentNotification(template);
  }
}
```

---

### Phase 2: Cron Jobs (1-2 days)

#### 3. Daily Analysis Cron Job

**Location**: `/workspaces/DailyUse/apps/api/src/modules/reminder/infrastructure/cron/dailyAnalysisCronJob.ts`

**Schedule**: Every day at 2:00 AM

**Logic**:
```typescript
export async function runDailyAnalysis() {
  const analysisService = new SmartFrequencyAnalysisService(...);
  const adjustmentService = new FrequencyAdjustmentService(...);

  // 1. Get all accounts
  const accounts = await getActiveAccounts();

  for (const account of accounts) {
    // 2. Analyze all templates
    const report = await analysisService.analyzeAllTemplates(account.uuid);

    // 3. For each low-performing reminder
    for (const template of report.lowEffective) {
      // 4. Suggest adjustment
      const suggestion = await analysisService.suggestFrequencyAdjustment(template.uuid);
      
      if (suggestion) {
        // 5. Apply auto-adjustment
        await adjustmentService.applyAutoAdjustment(template.uuid, suggestion);
      }
    }
  }
}
```

---

### Phase 3: API Endpoints (2-3 days)

#### 4. Create REST API Routes

**Location**: `/workspaces/DailyUse/apps/api/src/modules/reminder/http/routes/smartFrequencyRoutes.ts`

**Endpoints**:

```typescript
/**
 * GET /api/v1/reminders/effectiveness-report
 * Returns effectiveness analysis for all user's reminders
 */
router.get('/effectiveness-report', async (req, res) => {
  const { accountUuid } = req.user;
  
  const analysisService = new SmartFrequencyAnalysisService(...);
  const report = await analysisService.analyzeAllTemplates(accountUuid);
  
  res.json({
    overall: {
      avgClickRate: report.avgClickRate,
      avgEffectivenessScore: report.avgEffectivenessScore,
    },
    highEffective: report.highEffective.map(t => t.toClientDTO()),
    lowEffective: report.lowEffective.map(t => t.toClientDTO()),
  });
});

/**
 * POST /api/v1/reminders/:id/accept-adjustment
 * User accepts the suggested frequency adjustment
 */
router.post('/:id/accept-adjustment', async (req, res) => {
  const { id } = req.params;
  
  const adjustmentService = new FrequencyAdjustmentService(...);
  await adjustmentService.acceptAdjustment(id);
  
  const template = await reminderTemplateRepository.findById(id);
  res.json(template.toClientDTO());
});

/**
 * POST /api/v1/reminders/:id/reject-adjustment
 * User rejects the suggested frequency adjustment
 */
router.post('/:id/reject-adjustment', async (req, res) => {
  const { id } = req.params;
  
  const adjustmentService = new FrequencyAdjustmentService(...);
  await adjustmentService.rejectAdjustment(id);
  
  const template = await reminderTemplateRepository.findById(id);
  res.json(template.toClientDTO());
});

/**
 * GET /api/v1/reminders/recommended-time-slots
 * Returns best time slots based on user's response history
 */
router.get('/recommended-time-slots', async (req, res) => {
  const { accountUuid } = req.user;
  
  // Analyze response times across all reminders
  const analysis = await analyzeTimeSlotEffectiveness(accountUuid);
  
  res.json({
    bestSlots: analysis.bestSlots, // [{hourStart: 9, hourEnd: 10, avgResponseRate: 85}]
    worstSlots: analysis.worstSlots,
  });
});
```

**Swagger Documentation**:
```yaml
/api/v1/reminders/effectiveness-report:
  get:
    summary: Get reminder effectiveness report
    tags: [Smart Frequency]
    security:
      - bearerAuth: []
    responses:
      200:
        description: Effectiveness report
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EffectivenessReport'
```

---

### Phase 4: Integration Tests (1 day)

#### 5. Test End-to-End Flow

**Location**: `/workspaces/DailyUse/apps/api/src/modules/reminder/__tests__/smart-frequency.integration.test.ts`

```typescript
describe('Smart Frequency Integration', () => {
  it('should record response and update metrics', async () => {
    // 1. Create reminder template
    // 2. Record 10 responses (2 clicked, 8 ignored)
    // 3. Run analysis
    // 4. Verify metrics updated: clickRate=20%, ignoreRate=80%
  });

  it('should suggest frequency adjustment for low-performing reminder', async () => {
    // 1. Create reminder with low effectiveness
    // 2. Run daily analysis job
    // 3. Verify FrequencyAdjustment created
    // 4. Verify notification sent
  });

  it('should apply adjustment when user accepts', async () => {
    // 1. Create reminder with suggested adjustment
    // 2. Call /accept-adjustment endpoint
    // 3. Verify interval updated
    // 4. Verify userConfirmed = true
  });
});
```

---

## 🗃️ Database Migration

Before starting, run the migration:

```bash
cd apps/api

# 1. Start database (if not running)
docker-compose up -d postgres

# 2. Generate migration
pnpm prisma migrate dev --name add_smart_reminder_frequency

# 3. Verify migration applied
pnpm prisma migrate status
```

---

## 📊 Success Criteria

### Application Service Layer
- [ ] Analysis service calculates metrics correctly
- [ ] Adjustment service applies changes and notifies users
- [ ] Cron job runs daily without errors
- [ ] All API endpoints return correct data
- [ ] Integration tests pass with 100% coverage

### Overall Feature
- [ ] Response patterns tracked with 100% accuracy
- [ ] Effectiveness scores calculated correctly
- [ ] Frequency adjustments suggested when appropriate
- [ ] Users can accept/reject adjustments
- [ ] System learns from user feedback

---

## 🔗 Resources

- [Feature Spec](../modules/reminder/features/01-smart-frequency.md)
- [Infrastructure Implementation](./story-5-2-smart-frequency-infrastructure-COMPLETED.md)
- [Domain Layer Summary](../../packages/domain-server/src/reminder/IMPLEMENTATION_SUMMARY.md)

---

**Ready to Start**: Yes ✅  
**Blocked By**: None  
**Next Assignee**: [Your Name]
