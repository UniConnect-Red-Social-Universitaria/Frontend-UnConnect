import { useParams } from 'react-router-dom';
import SprintList from '../components/scrum/SprintList';
import SprintDashboard from '../components/scrum/SprintDashboard';

export default function ScrumScreen() {
  const { sprintId } = useParams<{ sprintId?: string }>();

  // Si hay un sprintId en la URL, mostrar el dashboard
  if (sprintId) {
    return <SprintDashboard />;
  }

  // Si no, mostrar la lista de sprints
  return <SprintList />;
}
