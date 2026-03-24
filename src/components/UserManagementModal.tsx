import React from 'react';
import { UserManagementPanel } from './UserManagementPanel';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated?: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  onUserCreated
}) => {

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="max-w-5xl w-full max-h-[85vh] overflow-y-auto">
        <UserManagementPanel showClose onClose={onClose} onUserCreated={onUserCreated} />
      </div>
    </div>
  );
};
