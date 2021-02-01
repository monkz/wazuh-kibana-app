import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  EuiPage,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTabs,
  EuiTab,
  EuiPanel,
  EuiCallOut,
  EuiEmptyPrompt,
  EuiSpacer,
} from '@elastic/eui';
import { Users } from './users/users';
import { Roles } from './roles/roles';
import { Policies } from './policies/policies';
import { GenericRequest } from '../../react-services/generic-request';
import { API_USER_STATUS_RUN_AS } from '../../../server/lib/cache-api-user-has-run-as';
import { AppState } from '../../react-services/app-state';
import { ErrorHandler } from '../../react-services/error-handler';
import { RolesMapping } from './roles-mapping/roles-mapping';
import { withReduxProvider, withGlobalBreadcrumb, withUserAuthorizationPrompt } from '../common/hocs';
import { compose } from 'redux';
import { WAZUH_ROLE_ADMINISTRATOR_NAME } from '../../../common/constants';
import { updateSecuritySection } from '../../redux/actions/securityActions';

const tabs = [
  {
    id: 'users',
    name: 'Users',
    disabled: false,
  },
  {
    id: 'roles',
    name: 'Roles',
    disabled: false,
  },
  {
    id: 'policies',
    name: 'Policies',
    disabled: false,
  },
  {
    id: 'roleMapping',
    name: 'Roles mapping',
    disabled: false,
  },
];

export const WzSecurity = compose(
  withReduxProvider,
  withGlobalBreadcrumb([{ text: '' }, { text: 'Security' }]),
  withUserAuthorizationPrompt(null, [WAZUH_ROLE_ADMINISTRATOR_NAME])
)(() => {
  const dispatch = useDispatch();

  // Get the initial tab when the component is initiated
  const securityTabRegExp = new RegExp(`tab=(${tabs.map(tab => tab.id).join('|')})`);
  const tab = window.location.href.match(securityTabRegExp);

  const [selectedTabId, setSelectedTabId] = useState(tab && tab[1] || 'users');


  const listenerLocationChanged = () => {
    const tab = window.location.href.match(securityTabRegExp);
    setSelectedTabId(tab && tab[1] || 'users')
  }

  const checkRunAsUser = async () => {
    const currentApi = AppState.getCurrentAPI();
    try {
      const ApiCheck = await GenericRequest.request('POST',
        '/api/check-api',
        currentApi
      );
      return ApiCheck.data.allow_run_as;

    } catch (error) {
      ErrorHandler.handle(error, 'Error checking the current API');
    }
  }
  const [allowRunAs, setAllowRunAs] = useState();
  useEffect(() => {
    // Manejando la promesa con .then/.catch
    checkRunAsUser()
      .then(result => setAllowRunAs(result)) // Setea la variable con el resultado de la petición
      .catch(error => console.log('Hubo un error')) //Maneja el error como quieras hacerlo
  }, []) // Poner [] solo hará que esto se ejecute cuando se monte el componente

  // This allows to redirect to a Security tab if you click a Security link in menu when you're already in a Security section
  useEffect(() => {
    window.addEventListener('popstate', listenerLocationChanged)
    return () => window.removeEventListener('popstate', listenerLocationChanged);
  });

  useEffect(() => {
    dispatch(updateSecuritySection(selectedTabId));
  })

  const onSelectedTabChanged = id => {
    window.location.href = window.location.href.replace(`tab=${selectedTabId}`, `tab=${id}`);
    setSelectedTabId(id);
  };

  const renderTabs = () => {
    return tabs.map((tab, index) => (
      <EuiTab
        {...(tab.href && { href: tab.href, target: '_blank' })}
        onClick={() => onSelectedTabChanged(tab.id)}
        isSelected={tab.id === selectedTabId}
        disabled={tab.disabled}
        key={index}>
        {tab.name}
      </EuiTab>
    ));
  };


  const isNotRunAs = () => {
    return (
      <EuiFlexGroup >
        <EuiFlexItem >
          <EuiSpacer></EuiSpacer>
          <EuiCallOut  title=" The current user  has not run_as activated in the configs or is not allowed from Wazuz API. " color="warning" iconType="alert">
          </EuiCallOut>
        </EuiFlexItem >
      </EuiFlexGroup>
    );
  }


  return (
    <EuiPage>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiTabs>{renderTabs()}</EuiTabs>
          {allowRunAs !== API_USER_STATUS_RUN_AS.ENABLED && isNotRunAs()}
          <EuiSpacer size='m'></EuiSpacer>
          {selectedTabId === 'users' &&
            <Users></Users>
          }
          {selectedTabId === 'roles' &&
            <Roles></Roles>
          }
          {selectedTabId === 'policies' &&
            <Policies></Policies>
          }
          {selectedTabId === 'roleMapping' &&
            <RolesMapping></RolesMapping>
          }
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPage>
  );
});
