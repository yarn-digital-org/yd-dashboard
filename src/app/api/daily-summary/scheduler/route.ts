// Daily Summary Scheduler API
// Handles automated report generation and delivery scheduling
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase-admin';
import { addDoc, collection, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';

interface ScheduleConfig {
  id?: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM format
  timezone: string;
  recipients: string[];
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  reportType: 'standard' | 'executive' | 'detailed';
  filters?: {
    agents?: string[];
    dateRange?: number;
    includeMetrics?: string[];
  };
}

interface CronJob {
  id: string;
  pattern: string;
  config: ScheduleConfig;
  active: boolean;
}

class SchedulerService {
  private cronJobs: Map<string, CronJob> = new Map();

  // Convert schedule config to cron pattern
  private toCronPattern(config: ScheduleConfig): string {
    const [hour, minute] = config.time.split(':').map(Number);
    
    switch (config.frequency) {
      case 'daily':
        return `${minute} ${hour} * * *`;
      case 'weekly':
        return `${minute} ${hour} * * 1`; // Every Monday
      case 'monthly':
        return `${minute} ${hour} 1 * *`; // First day of month
      default:
        return `${minute} ${hour} * * *`;
    }
  }

  // Calculate next run time
  private calculateNextRun(config: ScheduleConfig): Date {
    const now = new Date();
    const [hour, minute] = config.time.split(':').map(Number);
    
    let nextRun = new Date(now);
    nextRun.setHours(hour, minute, 0, 0);
    
    // If time has passed today, move to next occurrence
    if (nextRun <= now) {
      switch (config.frequency) {
        case 'daily':
          nextRun.setDate(nextRun.getDate() + 1);
          break;
        case 'weekly':
          nextRun.setDate(nextRun.getDate() + 7);
          break;
        case 'monthly':
          nextRun.setMonth(nextRun.getMonth() + 1, 1);
          break;
      }
    }
    
    return nextRun;
  }

  // Register or update scheduled job
  async registerSchedule(config: ScheduleConfig): Promise<string> {
    try {
      const cronPattern = this.toCronPattern(config);
      const nextRun = this.calculateNextRun(config);
      
      const scheduleData = {
        ...config,
        nextRun,
        updatedAt: new Date()
      };

      let scheduleId: string;
      
      if (config.id) {
        // Update existing schedule
        await updateDoc(doc(db, 'daily_summary_schedules', config.id), scheduleData);
        scheduleId = config.id;
      } else {
        // Create new schedule
        const docRef = await addDoc(collection(db, 'daily_summary_schedules'), {
          ...scheduleData,
          createdAt: new Date()
        });
        scheduleId = docRef.id;
      }

      // Update in-memory cron jobs
      this.cronJobs.set(scheduleId, {
        id: scheduleId,
        pattern: cronPattern,
        config: { ...config, id: scheduleId },
        active: config.enabled
      });

      console.log(`Schedule registered: ${scheduleId} - ${cronPattern}`);
      return scheduleId;
      
    } catch (error) {
      console.error('Error registering schedule:', error);
      throw error;
    }
  }

  // Load schedules from database
  async loadSchedules(): Promise<void> {
    try {
      const schedulesQuery = query(
        collection(db, 'daily_summary_schedules'),
        where('enabled', '==', true)
      );
      
      const snapshot = await getDocs(schedulesQuery);
      
      this.cronJobs.clear();
      
      snapshot.docs.forEach(doc => {
        const config = doc.data() as ScheduleConfig;
        const cronPattern = this.toCronPattern(config);
        
        this.cronJobs.set(doc.id, {
          id: doc.id,
          pattern: cronPattern,
          config: { ...config, id: doc.id },
          active: true
        });
      });
      
      console.log(`Loaded ${this.cronJobs.size} active schedules`);
      
    } catch (error) {
      console.error('Error loading schedules:', error);
      throw error;
    }
  }

  // Check and execute due jobs
  async checkDueJobs(): Promise<void> {
    const now = new Date();
    
    for (const [scheduleId, job] of this.cronJobs) {
      if (!job.active || !job.config.nextRun) continue;
      
      if (job.config.nextRun <= now) {
        try {
          await this.executeJob(job);
          
          // Update next run time
          const nextRun = this.calculateNextRun(job.config);
          await updateDoc(doc(db, 'daily_summary_schedules', scheduleId), {
            lastRun: now,
            nextRun,
            lastStatus: 'success'
          });
          
          job.config.nextRun = nextRun;
          job.config.lastRun = now;
          
        } catch (error) {
          console.error(`Error executing job ${scheduleId}:`, error);
          
          await updateDoc(doc(db, 'daily_summary_schedules', scheduleId), {
            lastRun: now,
            lastStatus: 'error',
            lastError: error.message
          });
        }
      }
    }
  }

  // Execute scheduled report generation
  private async executeJob(job: CronJob): Promise<void> {
    console.log(`Executing job: ${job.id} (${job.config.name})`);
    
    // Generate report data
    const reportResponse = await fetch('/api/daily-summary/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportType: job.config.reportType,
        filters: job.config.filters,
        format: 'both' // Generate both PDF and HTML
      })
    });
    
    if (!reportResponse.ok) {
      throw new Error(`Report generation failed: ${reportResponse.status}`);
    }
    
    const reportData = await reportResponse.json();
    
    // Send emails to recipients
    for (const recipient of job.config.recipients) {
      try {
        const emailResponse = await fetch('/api/daily-summary/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: recipient,
            subject: `Daily Summary Report - ${new Date().toLocaleDateString()}`,
            reportData,
            attachPdf: true
          })
        });
        
        if (!emailResponse.ok) {
          console.error(`Email delivery failed for ${recipient}`);
        }
        
      } catch (error) {
        console.error(`Email error for ${recipient}:`, error);
      }
    }
    
    console.log(`Job completed: ${job.id}`);
  }

  // Get all schedules
  getSchedules(): CronJob[] {
    return Array.from(this.cronJobs.values());
  }
}

const scheduler = new SchedulerService();

export async function GET() {
  try {
    await scheduler.loadSchedules();
    const schedules = scheduler.getSchedules();
    
    return NextResponse.json({
      success: true,
      schedules: schedules.map(job => ({
        id: job.id,
        name: job.config.name,
        frequency: job.config.frequency,
        time: job.config.time,
        enabled: job.config.enabled,
        nextRun: job.config.nextRun,
        lastRun: job.config.lastRun,
        recipients: job.config.recipients.length
      }))
    });
    
  } catch (error) {
    console.error('Scheduler GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const config: ScheduleConfig = await request.json();
    
    // Validation
    if (!config.name || !config.frequency || !config.time || !config.recipients.length) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(config.time)) {
      return NextResponse.json(
        { success: false, error: 'Invalid time format (use HH:MM)' },
        { status: 400 }
      );
    }
    
    const scheduleId = await scheduler.registerSchedule(config);
    
    return NextResponse.json({
      success: true,
      scheduleId,
      message: 'Schedule created successfully'
    });
    
  } catch (error) {
    console.error('Scheduler POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('id');
    
    if (!scheduleId) {
      return NextResponse.json(
        { success: false, error: 'Schedule ID required' },
        { status: 400 }
      );
    }
    
    await deleteDoc(doc(db, 'daily_summary_schedules', scheduleId));
    
    return NextResponse.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
    
  } catch (error) {
    console.error('Scheduler DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Background job checker (call this periodically)
export async function PUT() {
  try {
    await scheduler.loadSchedules();
    await scheduler.checkDueJobs();
    
    return NextResponse.json({
      success: true,
      message: 'Job check completed',
      activeJobs: scheduler.getSchedules().length
    });
    
  } catch (error) {
    console.error('Job checker error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Export scheduler instance for external use
export { scheduler };
