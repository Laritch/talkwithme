import React, { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  UserIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  CheckIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from './i18n';

// Mock user roles and permissions data
const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
  CUSTOM: 'custom'
};

const PERMISSIONS = {
  VIEW: 'view',
  EDIT: 'edit',
  DELETE: 'delete',
  SHARE: 'share',
  DOWNLOAD: 'download',
  COMMENT: 'comment',
  APPROVE: 'approve'
};

// Mock users for demo
const MOCK_USERS = [
  { id: 'user1', name: 'John Smith', email: 'john@example.com', avatar: 'https://same-assets.com/avatar/1.jpg', role: ROLES.ADMIN },
  { id: 'user2', name: 'Sarah Johnson', email: 'sarah@example.com', avatar: 'https://same-assets.com/avatar/2.jpg', role: ROLES.EDITOR },
  { id: 'user3', name: 'Michael Chen', email: 'michael@example.com', avatar: 'https://same-assets.com/avatar/3.jpg', role: ROLES.VIEWER },
  { id: 'user4', name: 'Jessica Williams', email: 'jessica@example.com', avatar: 'https://same-assets.com/avatar/4.jpg', role: ROLES.CUSTOM },
  { id: 'user5', name: 'David Kim', email: 'david@example.com', avatar: 'https://same-assets.com/avatar/5.jpg', role: ROLES.EDITOR }
];

// Mock role definitions
const ROLE_DEFINITIONS = {
  [ROLES.ADMIN]: {
    name: 'Administrator',
    description: 'Full access to all resources and settings',
    permissions: Object.values(PERMISSIONS)
  },
  [ROLES.EDITOR]: {
    name: 'Editor',
    description: 'Can edit and manage resources',
    permissions: [PERMISSIONS.VIEW, PERMISSIONS.EDIT, PERMISSIONS.COMMENT, PERMISSIONS.DOWNLOAD, PERMISSIONS.SHARE]
  },
  [ROLES.VIEWER]: {
    name: 'Viewer',
    description: 'Can view and download resources',
    permissions: [PERMISSIONS.VIEW, PERMISSIONS.DOWNLOAD, PERMISSIONS.COMMENT]
  },
  [ROLES.CUSTOM]: {
    name: 'Custom',
    description: 'Custom permission set',
    permissions: []
  }
};

// Mock user groups
const MOCK_GROUPS = [
  { id: 'group1', name: 'Marketing Team', memberCount: 8, role: ROLES.EDITOR },
  { id: 'group2', name: 'Executive Leadership', memberCount: 5, role: ROLES.ADMIN },
  { id: 'group3', name: 'Product Development', memberCount: 12, role: ROLES.EDITOR },
  { id: 'group4', name: 'Sales Representatives', memberCount: 20, role: ROLES.VIEWER }
];

// Permissions System Component
const PermissionsSystem = ({ resourceId, onClose }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState(MOCK_USERS);
  const [groups, setGroups] = useState(MOCK_GROUPS);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRole, setEditingRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [addingUser, setAddingUser] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [addingGroup, setAddingGroup] = useState(false);
  const [showAddGroupForm, setShowAddGroupForm] = useState(false);
  const [editingPermissions, setEditingPermissions] = useState(null);
  const [customPermissions, setCustomPermissions] = useState({});

  // Filter users or groups based on search query
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    // The filtering is handled above as searchQuery changes
  };

  // Add a new user
  const handleAddUser = async (e) => {
    e.preventDefault();

    if (!newUserEmail || !newUserEmail.includes('@')) {
      return; // Simple validation
    }

    setAddingUser(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create new user with default role
      const newUser = {
        id: `user${users.length + 1}`,
        name: newUserEmail.split('@')[0], // Simple name extraction from email
        email: newUserEmail,
        avatar: `https://same-assets.com/avatar/${Math.floor(Math.random() * 8) + 1}.jpg`,
        role: ROLES.VIEWER // Default role
      };

      setUsers([...users, newUser]);
      setNewUserEmail('');
      setShowAddUserForm(false);
    } catch (error) {
      console.error('Error adding user:', error);
    } finally {
      setAddingUser(false);
    }
  };

  // Remove a user
  const handleRemoveUser = async (userId) => {
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setUsers(users.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error removing user:', error);
    } finally {
      setLoading(false);
    }
  };

  // Change user role
  const handleRoleChange = async (userId, newRole) => {
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      ));
    } catch (error) {
      console.error('Error changing role:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add a new group
  const handleAddGroup = async (e) => {
    e.preventDefault();

    if (!newGroupName) {
      return; // Simple validation
    }

    setAddingGroup(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create new group with default role
      const newGroup = {
        id: `group${groups.length + 1}`,
        name: newGroupName,
        memberCount: 0,
        role: ROLES.VIEWER // Default role
      };

      setGroups([...groups, newGroup]);
      setNewGroupName('');
      setShowAddGroupForm(false);
    } catch (error) {
      console.error('Error adding group:', error);
    } finally {
      setAddingGroup(false);
    }
  };

  // Remove a group
  const handleRemoveGroup = async (groupId) => {
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setGroups(groups.filter(group => group.id !== groupId));
    } catch (error) {
      console.error('Error removing group:', error);
    } finally {
      setLoading(false);
    }
  };

  // Change group role
  const handleGroupRoleChange = async (groupId, newRole) => {
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setGroups(groups.map(group =>
        group.id === groupId ? { ...group, role: newRole } : group
      ));
    } catch (error) {
      console.error('Error changing role:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle permission for custom role
  const togglePermission = (permission) => {
    if (!editingPermissions) return;

    const currentPermissions = customPermissions[editingPermissions] || [];

    if (currentPermissions.includes(permission)) {
      setCustomPermissions({
        ...customPermissions,
        [editingPermissions]: currentPermissions.filter(p => p !== permission)
      });
    } else {
      setCustomPermissions({
        ...customPermissions,
        [editingPermissions]: [...currentPermissions, permission]
      });
    }
  };

  // Save custom permissions
  const saveCustomPermissions = async () => {
    if (!editingPermissions) return;

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update ROLE_DEFINITIONS with custom permissions
      ROLE_DEFINITIONS[ROLES.CUSTOM].permissions = customPermissions[editingPermissions] || [];

      // Reset state
      setEditingPermissions(null);
    } catch (error) {
      console.error('Error saving permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize custom permissions when editing
  useEffect(() => {
    if (editingPermissions) {
      // For existing user with CUSTOM role
      const user = users.find(u => u.id === editingPermissions);
      if (user && user.role === ROLES.CUSTOM) {
        if (!customPermissions[editingPermissions]) {
          setCustomPermissions({
            ...customPermissions,
            [editingPermissions]: [...ROLE_DEFINITIONS[ROLES.CUSTOM].permissions]
          });
        }
      }
    }
  }, [editingPermissions]);

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Manage Permissions</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="px-6 flex -mb-px">
            <button
              className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'users'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('users')}
            >
              <UserIcon className="h-5 w-5 mr-2" />
              Users
            </button>
            <button
              className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'groups'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('groups')}
            >
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Groups
            </button>
            <button
              className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'roles'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('roles')}
            >
              <LockClosedIcon className="h-5 w-5 mr-2" />
              Roles
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {activeTab === 'users' && (
            <div>
              {/* Search and add user */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
                <form onSubmit={handleSearch} className="relative flex-grow max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>

                <button
                  onClick={() => setShowAddUserForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add User
                </button>
              </div>

              {/* Add user form */}
              {showAddUserForm && (
                <div className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Add New User</h3>
                  <form onSubmit={handleAddUser} className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-grow">
                      <input
                        type="email"
                        placeholder="user@example.com"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={addingUser}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 ${
                          addingUser ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                      >
                        {addingUser ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Adding...
                          </>
                        ) : 'Add User'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddUserForm(false)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Users list */}
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 border border-gray-200 rounded-lg">
                  <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No users found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchQuery ? 'Try a different search term.' : 'Add users to grant them access to this resource.'}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img className="h-10 w-10 rounded-full" src={user.avatar} alt={user.name} />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            >
                              {Object.keys(ROLE_DEFINITIONS).map((role) => (
                                <option key={role} value={role}>
                                  {ROLE_DEFINITIONS[role].name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleRemoveUser(user.id)}
                              className="text-red-600 hover:text-red-900 ml-2"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'groups' && (
            <div>
              {/* Search and add group */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
                <form onSubmit={handleSearch} className="relative flex-grow max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search groups..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>

                <button
                  onClick={() => setShowAddGroupForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Group
                </button>
              </div>

              {/* Add group form */}
              {showAddGroupForm && (
                <div className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Add New Group</h3>
                  <form onSubmit={handleAddGroup} className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-grow">
                      <input
                        type="text"
                        placeholder="Group name"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={addingGroup}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 ${
                          addingGroup ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                      >
                        {addingGroup ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Adding...
                          </>
                        ) : 'Add Group'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddGroupForm(false)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Groups list */}
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="text-center py-12 border border-gray-200 rounded-lg">
                  <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No groups found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchQuery ? 'Try a different search term.' : 'Add groups to grant team access to this resource.'}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Group
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredGroups.map((group) => (
                        <tr key={group.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-indigo-100 rounded-full">
                                <UserGroupIcon className="h-6 w-6 text-indigo-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{group.name}</div>
                                <div className="text-sm text-gray-500">{group.memberCount} members</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              value={group.role}
                              onChange={(e) => handleGroupRoleChange(group.id, e.target.value)}
                            >
                              {Object.keys(ROLE_DEFINITIONS).map((role) => (
                                <option key={role} value={role}>
                                  {ROLE_DEFINITIONS[role].name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleRemoveGroup(group.id)}
                              className="text-red-600 hover:text-red-900 ml-2"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'roles' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Role Definitions</h3>
              <p className="text-sm text-gray-500 mb-6">
                Roles determine what actions users and groups can perform on this resource.
              </p>

              <div className="space-y-6">
                {Object.keys(ROLE_DEFINITIONS).map(role => (
                  <div key={role} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{ROLE_DEFINITIONS[role].name}</h4>
                        <p className="text-sm text-gray-500">{ROLE_DEFINITIONS[role].description}</p>
                      </div>
                      {role === ROLES.CUSTOM && (
                        <button
                          onClick={() => setEditingPermissions('custom')}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Customize
                        </button>
                      )}
                    </div>
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.values(PERMISSIONS).map(permission => (
                        <div
                          key={permission}
                          className={`flex items-center p-2 rounded-md ${
                            ROLE_DEFINITIONS[role].permissions.includes(permission) ? 'bg-green-50' : 'bg-gray-50'
                          }`}
                        >
                          {ROLE_DEFINITIONS[role].permissions.includes(permission) ? (
                            <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                          ) : (
                            <XMarkIcon className="h-5 w-5 text-gray-400 mr-2" />
                          )}
                          <span className="text-sm font-medium capitalize">
                            {permission}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom Permissions Editor */}
              {editingPermissions && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                    <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">Customize Permissions</h3>
                      <button
                        onClick={() => setEditingPermissions(null)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="p-6">
                      <p className="text-sm text-gray-500 mb-4">
                        Select the permissions for this custom role.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                        {Object.values(PERMISSIONS).map(permission => {
                          const isActive = customPermissions[editingPermissions]?.includes(permission);
                          return (
                            <div
                              key={permission}
                              onClick={() => togglePermission(permission)}
                              className={`flex items-center p-3 rounded-md cursor-pointer border ${
                                isActive
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className={`h-5 w-5 mr-3 rounded border flex items-center justify-center ${
                                isActive ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                              }`}>
                                {isActive && <CheckIcon className="h-4 w-4 text-white" />}
                              </div>
                              <span className="text-sm font-medium capitalize">
                                {permission}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => setEditingPermissions(null)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveCustomPermissions}
                          disabled={loading}
                          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 ${
                            loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700'
                          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                        >
                          {loading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Saving...
                            </>
                          ) : 'Save Permissions'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PermissionsSystem;
