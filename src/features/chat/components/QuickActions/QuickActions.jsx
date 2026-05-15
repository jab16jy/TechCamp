const QuickActions = ({ acciones, onAccion }) => {
  return (
    <div className="agro-acciones">
      {acciones.map((acc) => (
        <button
          key={acc.id}
          className="agro-accion-btn"
          onClick={() => onAccion(acc.id)}
        >
          {acc.icon}
          <span>{acc.label}</span>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;