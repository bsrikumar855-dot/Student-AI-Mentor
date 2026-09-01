import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { CohortStudentSchema, type CohortStudent } from '../../../api/schemas';
import { z } from 'zod';

export function useCohort() {
  return useQuery({
    queryKey: ['cohort'],
    queryFn: () => apiClient.get<CohortStudent[]>('/students', z.array(CohortStudentSchema)),
  });
}

export default useCohort;
