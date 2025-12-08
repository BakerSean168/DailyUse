/**
 * SyncConfigWizard Component Tests
 *
 * @module components/sync/__tests__/SyncConfigWizard.test
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SyncConfigWizard } from '../SyncConfigWizard';

describe('SyncConfigWizard', () => {
  /**
   * Step 1: Platform Selection
   */
  describe('Step 1: Platform Selection', () => {
    it('should render platform selection options', () => {
      render(<SyncConfigWizard />);

      expect(screen.getByText('Select Cloud Platform')).toBeInTheDocument();
      expect(screen.getByText('GitHub')).toBeInTheDocument();
      expect(screen.getByText('坚果云 (Nutstore)')).toBeInTheDocument();
      expect(screen.getByText('Dropbox')).toBeInTheDocument();
      expect(screen.getByText('Self-hosted')).toBeInTheDocument();
    });

    it('should allow selecting a platform', async () => {
      const user = userEvent.setup();
      render(<SyncConfigWizard />);

      const githubOption = screen.getByText('GitHub').closest('div');
      await user.click(githubOption!);

      expect(githubOption?.parentElement).toHaveClass('border-blue-500');
    });

    it('should show platform details', () => {
      render(<SyncConfigWizard />);

      expect(screen.getByText(/Unlimited storage/)).toBeInTheDocument();
      expect(screen.getByText(/30GB free/)).toBeInTheDocument();
      expect(screen.getByText(/2GB free/)).toBeInTheDocument();
    });

    it('should show info message after selecting platform', async () => {
      const user = userEvent.setup();
      render(<SyncConfigWizard />);

      const githubOption = screen.getByText('GitHub').closest('div');
      await user.click(githubOption!);

      expect(
        screen.getByText(/valid credentials to proceed/)
      ).toBeInTheDocument();
    });

    it('should enable Next button after selecting platform', async () => {
      const user = userEvent.setup();
      render(<SyncConfigWizard />);

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();

      const githubOption = screen.getByText('GitHub').closest('div');
      await user.click(githubOption!);

      expect(nextButton).not.toBeDisabled();
    });
  });

  /**
   * Step 2: Authentication
   */
  describe('Step 2: Authentication', () => {
    it('should show GitHub token input after selecting GitHub', async () => {
      const user = userEvent.setup();
      render(<SyncConfigWizard />);

      const githubOption = screen.getByText('GitHub').closest('div');
      await user.click(githubOption!);

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('ghp_...')
        ).toBeInTheDocument();
      });
    });

    it('should show Nutstore email and password inputs', async () => {
      const user = userEvent.setup();
      render(<SyncConfigWizard />);

      const nutstoreOption = screen.getByText(
        '坚果云 (Nutstore)'
      ).closest('div');
      await user.click(nutstoreOption!);

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('your@email.com')
        ).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText('••••••••')
        ).toBeInTheDocument();
      });
    });

    it('should show Dropbox token input', async () => {
      const user = userEvent.setup();
      render(<SyncConfigWizard />);

      const dropboxOption = screen.getByText('Dropbox').closest('div');
      await user.click(dropboxOption!);

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/sl\.Bbbb/)
        ).toBeInTheDocument();
      });
    });

    it('should show server URL, username, and password for self-hosted', async () => {
      const user = userEvent.setup();
      render(<SyncConfigWizard />);

      const selfHostedOption = screen
        .getByText('Self-hosted')
        .closest('div');
      await user.click(selfHostedOption!);

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('https://your-server.com/dav')
        ).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText('username')
        ).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText('••••••••')
        ).toBeInTheDocument();
      });
    });

    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      render(<SyncConfigWizard />);

      const githubOption = screen.getByText('GitHub').closest('div');
      await user.click(githubOption!);

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        const tokenInput = screen.getByPlaceholderText(
          'ghp_...'
        ) as HTMLInputElement;

        expect(tokenInput.type).toBe('password');

        const toggleButton = tokenInput.parentElement?.querySelector(
          'button'
        );
        await user.click(toggleButton!);

        expect(tokenInput.type).toBe('text');
      });
    });
  });

  /**
   * Step 3: Encryption Password
   */
  describe('Step 3: Encryption Password', () => {
    it('should show encryption password inputs', async () => {
      const user = userEvent.setup();
      render(<SyncConfigWizard />);

      // Select GitHub and proceed to step 3
      const githubOption = screen.getByText('GitHub').closest('div');
      await user.click(githubOption!);

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('ghp_...')).toBeInTheDocument();
      });

      // Mock successful authentication
      await user.click(screen.getByText('Verify Connection'));

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('Enter a strong password')
        ).toBeInTheDocument();
      });
    });

    it('should display password strength indicator', async () => {
      const user = userEvent.setup();
      render(<SyncConfigWizard />);

      const githubOption = screen.getByText('GitHub').closest('div');
      await user.click(githubOption!);

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await user.click(screen.getByText('Verify Connection'));

      await waitFor(() => {
        expect(
          screen.getByText('Password Strength')
        ).toBeInTheDocument();
      });
    });

    it('should validate password confirmation', async () => {
      const user = userEvent.setup();
      render(<SyncConfigWizard />);

      const githubOption = screen.getByText('GitHub').closest('div');
      await user.click(githubOption!);

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await user.click(screen.getByText('Verify Connection'));

      await waitFor(() => {
        const passwordInput = screen.getByPlaceholderText(
          'Enter a strong password'
        );
        const confirmInput = screen.getByPlaceholderText(
          'Confirm your password'
        );

        fireEvent.change(passwordInput, { target: { value: 'TestPass123!' } });
        fireEvent.change(confirmInput, { target: { value: 'DifferentPass' } });

        expect(
          screen.getByText(/Passwords do not match/)
        ).toBeInTheDocument();
      });
    });

    it('should generate random password', async () => {
      const user = userEvent.setup();
      render(<SyncConfigWizard />);

      const githubOption = screen.getByText('GitHub').closest('div');
      await user.click(githubOption!);

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await user.click(screen.getByText('Verify Connection'));

      await waitFor(() => {
        const generateButton = screen.getByText('Generate Random Password');
        const passwordInput = screen.getByPlaceholderText(
          'Enter a strong password'
        ) as HTMLInputElement;

        expect(passwordInput.value).toBe('');

        fireEvent.click(generateButton);

        expect(passwordInput.value.length).toBeGreaterThanOrEqual(16);
      });
    });
  });

  /**
   * Step 4: Sync Options
   */
  describe('Step 4: Sync Options', () => {
    it('should show sync direction options', async () => {
      const user = userEvent.setup();
      render(<SyncConfigWizard />);

      // Navigate to step 4
      const githubOption = screen.getByText('GitHub').closest('div');
      await user.click(githubOption!);

      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Verify Connection'));

      // Fill password and continue
      const passwordInput = screen.getByPlaceholderText(
        'Enter a strong password'
      );
      await user.type(passwordInput, 'SecurePass123!');
      const confirmInput = screen.getByPlaceholderText(
        'Confirm your password'
      );
      await user.type(confirmInput, 'SecurePass123!');

      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(
          screen.getByText('Upload local data to cloud')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Download cloud data to local')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Manual selection')
        ).toBeInTheDocument();
      });
    });

    it('should allow selecting entity types', async () => {
      const user = userEvent.setup();
      render(<SyncConfigWizard />);

      // Navigate to step 4
      const githubOption = screen.getByText('GitHub').closest('div');
      await user.click(githubOption!);

      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Verify Connection'));

      const passwordInput = screen.getByPlaceholderText(
        'Enter a strong password'
      );
      await user.type(passwordInput, 'SecurePass123!');
      const confirmInput = screen.getByPlaceholderText(
        'Confirm your password'
      );
      await user.type(confirmInput, 'SecurePass123!');

      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);

        // All should be checked by default
        checkboxes.forEach(checkbox => {
          expect(checkbox).toBeChecked();
        });
      });
    });
  });

  /**
   * Navigation
   */
  describe('Navigation', () => {
    it('should disable Previous button on step 1', () => {
      render(<SyncConfigWizard />);

      const prevButton = screen.getByText('Previous');
      expect(prevButton).toBeDisabled();
    });

    it('should allow navigating forward and backward', async () => {
      const user = userEvent.setup();
      render(<SyncConfigWizard />);

      // Select platform and go to step 2
      const githubOption = screen.getByText('GitHub').closest('div');
      await user.click(githubOption!);

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('ghp_...')
        ).toBeInTheDocument();
      });

      // Go back
      const prevButton = screen.getByText('Previous');
      await user.click(prevButton);

      expect(
        screen.getByText('Select Cloud Platform')
      ).toBeInTheDocument();
    });

    it('should show step indicators', () => {
      render(<SyncConfigWizard />);

      expect(screen.getByText('Select Platform')).toBeInTheDocument();
      expect(screen.getByText('Authentication')).toBeInTheDocument();
      expect(screen.getByText('Encryption')).toBeInTheDocument();
      expect(screen.getByText('Sync Options')).toBeInTheDocument();
    });
  });

  /**
   * Form Validation
   */
  describe('Form Validation', () => {
    it('should prevent proceeding without selecting a platform', async () => {
      const user = userEvent.setup();
      render(<SyncConfigWizard />);

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      // Should not advance
      expect(
        screen.getByText('Select Cloud Platform')
      ).toBeInTheDocument();
    });

    it('should prevent proceeding with weak password', async () => {
      const user = userEvent.setup();
      render(<SyncConfigWizard />);

      // Navigate to password step
      const githubOption = screen.getByText('GitHub').closest('div');
      await user.click(githubOption!);

      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Verify Connection'));

      // Enter weak password
      const passwordInput = screen.getByPlaceholderText(
        'Enter a strong password'
      );
      await user.type(passwordInput, 'weak');

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      // Should show error
      expect(
        screen.getByText(/Password must be at least 8 characters/)
      ).toBeInTheDocument();
    });
  });

  /**
   * Callbacks
   */
  describe('Callbacks', () => {
    it('should call onComplete callback when wizard is completed', async () => {
      const onComplete = vi.fn();
      const user = userEvent.setup();

      render(<SyncConfigWizard onComplete={onComplete} />);

      // Select platform
      const githubOption = screen.getByText('GitHub').closest('div');
      await user.click(githubOption!);

      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Verify Connection'));

      // Enter password
      const passwordInput = screen.getByPlaceholderText(
        'Enter a strong password'
      );
      await user.type(passwordInput, 'SecurePass123!');
      const confirmInput = screen.getByPlaceholderText(
        'Confirm your password'
      );
      await user.type(confirmInput, 'SecurePass123!');

      await user.click(screen.getByText('Next'));

      // Complete setup
      await waitFor(() => {
        expect(
          screen.getByText('Complete Setup')
        ).toBeInTheDocument();
      });

      const completeButton = screen.getByText('Complete Setup');
      await user.click(completeButton);

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });
  });
});
